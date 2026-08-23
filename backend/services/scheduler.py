"""Scheduler Service — runs the 5-minute decision cycle as a background task.

The Decision Manager orchestrates the AI optimization engine every 5 minutes:
1. Read sensors via the adapter layer
2. Update the Digital Twin
3. Run the forecast engine (24h ahead)
4. Compute reliability guard constraints
5. Evaluate dispatch × battery × VNM × load-shift candidates
6. Score by cost + carbon, filter by reliability floor
7. Select best strategy, execute, log with explanation
8. Broadcast twin update and decision via WebSocket
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import time
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete

from backend.adapters.simulated import SimulatedAdapter, SimulatedConfig
from backend.config import settings
from backend.db.database import AsyncSessionLocal as SessionFactory
from backend.models.decision_log import DecisionLog
from backend.services.decision_manager import DecisionManager
from backend.services.digital_twin_store import DigitalTwinStore
from backend.ws.websocket_manager import ConnectionManager

logger = logging.getLogger(__name__)


class SchedulerService:
    """Orchestrates the 5-minute decision cycle.

    Each cycle: read sensors → update twin (persist to DB) → run the AI
    decision loop → broadcast the live twin update and decision via WebSocket.
    """

    def __init__(self, adapter: SimulatedAdapter, manager: ConnectionManager, db_session_factory=None):
        self.adapter = adapter
        self.manager = manager
        self.db_session_factory = db_session_factory
        self.is_running = False
        self._task: asyncio.Task | None = None
        self.last_cycle: datetime | None = None
        self.cycle_count = 0
        self.interval_seconds = settings.decision_cycle_seconds
        self._last_prune = time.time()

        # Services
        self.twin_store = DigitalTwinStore(adapter)
        self._decision_manager: DecisionManager | None = None

    def set_decision_manager(self, decision_manager: DecisionManager) -> None:
        """Inject the AI Decision Manager."""
        self._decision_manager = decision_manager

    async def start(self) -> None:
        """Start the background scheduler task."""
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info("Scheduler started. Interval: %s seconds.", self.interval_seconds)

    async def stop(self) -> None:
        """Stop the background scheduler."""
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Scheduler stopped.")

    async def shutdown(self) -> None:
        """Graceful shutdown."""
        await self.stop()

    async def _persist_decision_logs(self, decisions: list[dict]) -> None:
        """Helper to log decisions to the database."""
        if not self.db_session_factory:
            return
        try:
            async with self.db_session_factory() as session:
                for d in decisions:
                    log = DecisionLog(
                        decision_id=d["decision_id"],
                        timestamp=datetime.fromisoformat(d["timestamp"]),
                        decision_type=d["decision_type"],
                        action=d["action"],
                        confidence_pct=d["confidence_pct"],
                        reason=d["reason"],
                        alternative_considered=d["alternative_considered"],
                        expected_savings_inr=d["expected_savings_inr"],
                        expected_carbon_reduction_kg=d["expected_carbon_reduction_kg"],
                        building_id=d.get("building_id"),
                        battery_soc_after_pct=d["battery_soc_after_pct"],
                        context_json=json.dumps(d.get("context", {})),
                    )
                    session.add(log)
                await session.commit()
        except Exception as e:
            logger.warning(f"Decision log persist failed: {e}")

    async def prune_old_decisions(self, days: int | None = None) -> int:
        """Delete decision logs older than the retention window to bound DB growth."""
        if not self.db_session_factory:
            return 0
        retention_days = days or settings.decision_retention_days
        cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
        async with self.db_session_factory() as session:
            result = await session.execute(delete(DecisionLog).where(DecisionLog.timestamp < cutoff))
            await session.commit()
        removed = result.rowcount
        if removed:
            logger.info("Pruned %d decision logs older than %d days.", removed, retention_days)
        return removed

    @staticmethod
    def _build_buildings_payload(twin_snapshot: dict) -> dict:
        """Filter the twin snapshot down to building entries for WS broadcast."""
        return {
            k: v for k, v in twin_snapshot.items()
            if not k.startswith("turbine_") and not k.startswith("battery_") and k != "timestamp"
            and isinstance(v, dict)
        }

    async def _broadcast_twin_update(self, twin_snapshot: dict, cycle_number: int) -> None:
        """Broadcast the live building twin via WebSocket."""
        await self.manager.send_to_all({
            "type": "twin_update",
            "cycle_number": cycle_number,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "buildings": self._build_buildings_payload(twin_snapshot),
            "timestamp_of_data": twin_snapshot.get("timestamp", ""),
        })

    async def _execute_cycle(self) -> dict:
        """One full cycle: read → persist twin → broadcast twin + decision.

        Shared by the background loop and manual force-cycle triggers.
        """
        # Step 1: Read sensors once
        twin_snapshot = await self.adapter.read_sensors()

        # Step 2: Persist twin to DB
        if self.db_session_factory:
            try:
                async with self.db_session_factory() as session:
                    await self.twin_store.update_twin_with_data(session, twin_snapshot)
            except Exception as e:
                logger.warning(f"DB persist failed (non-blocking): {e}")

        # Step 3: Broadcast the live twin update (buildings)
        await self._broadcast_twin_update(twin_snapshot, self.cycle_count)

        # Step 4: Full decision loop
        decision = None
        if self._decision_manager:
            decision = await self._decision_manager.run_cycle(twin_snapshot)

            if decision and decision.get("decisions"):
                await self._persist_decision_logs(decision["decisions"])

            if decision:
                await self.manager.send_to_all({
                    "type": "full_cycle",
                    "cycle_number": self.cycle_count,
                    "result": decision,
                })

        self.last_cycle = datetime.now(timezone.utc)
        return {"twin_snapshot": twin_snapshot, "decision": decision}

    async def _run_loop(self) -> None:
        """Main loop: run one decision cycle per interval."""
        await asyncio.sleep(1)  # Brief startup delay

        while self.is_running:
            cycle_start = time.time()
            self.cycle_count += 1

            # Prune stale decision logs at most once per 24h of wall time
            if time.time() - self._last_prune >= 86400:
                try:
                    await self.prune_old_decisions()
                except Exception:
                    logger.exception("Decision log pruning failed (non-blocking)")
                self._last_prune = time.time()

            try:
                await self._execute_cycle()

                # Broadcast adapter health
                health = await self.adapter.health()
                await self.manager.send_to_all({
                    "type": "health",
                    "adapter": health,
                    "scheduler_cycles": self.cycle_count,
                    "clients": self.manager.client_count,
                })

            except Exception:
                logger.exception(f"Scheduler cycle {self.cycle_count} failed")
                await self.manager.send_to_all({
                    "type": "error",
                    "message": "Scheduler cycle failed",
                    "cycle_number": self.cycle_count,
                })

            # Sleep until next interval
            elapsed = time.time() - cycle_start
            sleep_time = max(0.1, self.interval_seconds - elapsed)
            await asyncio.sleep(sleep_time)

    async def force_cycle(self) -> dict:
        """Manually trigger one cycle (for testing/demo)."""
        self.cycle_count += 1
        result = await self._execute_cycle()
        return {
            "cycle_number": self.cycle_count,
            "timestamp": self.last_cycle.isoformat(),
            "twin_snapshot": result["twin_snapshot"],
            "decision": result["decision"],
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the VPP decision scheduler.")
    parser.add_argument(
        "--mode",
        choices=["continuous", "one-shot"],
        default="continuous",
        help="continuous: run forever (default), one-shot: run a single cycle",
    )
    return parser.parse_args()


async def _standalone_main(mode: str) -> None:
    from backend.adapters.site_config import default_buildings

    adapter = SimulatedAdapter(
        SimulatedConfig(
            time_scale=settings.simulator_time_scale,
            scenario=settings.simulator_default_scenario,
        ),
        default_buildings(),
    )
    manager = ConnectionManager()
    scheduler = SchedulerService(adapter, manager, db_session_factory=SessionFactory)
    decision_manager = DecisionManager(adapter, manager)
    scheduler.set_decision_manager(decision_manager)

    await scheduler.start()
    if mode == "one-shot":
        await scheduler.force_cycle()
        await scheduler.stop()
        return

    try:
        await asyncio.Event().wait()
    except (KeyboardInterrupt, asyncio.CancelledError):
        pass
    finally:
        await scheduler.shutdown()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    args = parse_args()
    asyncio.run(_standalone_main(args.mode))