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
import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from typing import Optional

from backend.adapters.simulated import SimulatedAdapter
from backend.services.digital_twin_store import DigitalTwinStore
from backend.services.decision_manager import DecisionManager
from backend.models.decision_log import DecisionLog
from backend.ws.websocket_manager import ConnectionManager
from backend.db.database import AsyncSessionLocal
from backend.config import settings

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
        self._task: Optional[asyncio.Task] = None
        self.last_cycle: Optional[datetime] = None
        self.cycle_count = 0
        self.interval_seconds = settings.decision_cycle_seconds

        # Services
        self.twin_store = DigitalTwinStore(adapter)
        self._decision_manager: Optional[DecisionManager] = None

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

    async def _run_loop(self) -> None:
        """Main cycle: read → update twin → decide → broadcast twin + decision."""
        await asyncio.sleep(1)  # Brief startup delay

        while self.is_running:
            cycle_start = time.time()
            self.cycle_count += 1

            try:
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

                # Step 5: Broadcast adapter health
                health = await self.adapter.health()
                await self.manager.send_to_all({
                    "type": "health",
                    "adapter": health,
                    "scheduler_cycles": self.cycle_count,
                    "clients": self.manager.client_count,
                })

                self.last_cycle = datetime.now(timezone.utc)

            except Exception as e:
                logger.error(f"Scheduler cycle {self.cycle_count} failed: {e}", exc_info=True)
                await self.manager.send_to_all({
                    "type": "error",
                    "message": str(e),
                    "cycle_number": self.cycle_count,
                })

            # Sleep until next interval
            elapsed = time.time() - cycle_start
            sleep_time = max(0.1, self.interval_seconds - elapsed)
            await asyncio.sleep(sleep_time)

    async def force_cycle(self) -> dict:
        """Manually trigger one cycle (for testing/demo)."""
        self.cycle_count += 1
        twin_snapshot = await self.adapter.read_sensors()

        # Step 2: Persist twin to DB
        if self.db_session_factory:
            try:
                async with self.db_session_factory() as session:
                    await self.twin_store.update_twin_with_data(session, twin_snapshot)
            except Exception as e:
                logger.warning(f"DB persist failed in force_cycle: {e}")

        # Broadcast the live twin update (buildings)
        await self._broadcast_twin_update(twin_snapshot, self.cycle_count)

        decision = None
        if self._decision_manager:
            decision = await self._decision_manager.run_cycle(twin_snapshot)

            # Persist decision logs to DB
            if decision and decision.get("decisions"):
                await self._persist_decision_logs(decision["decisions"])

            if decision:
                await self.manager.send_to_all({
                    "type": "full_cycle",
                    "cycle_number": self.cycle_count,
                    "result": decision,
                })

        self.last_cycle = datetime.now(timezone.utc)

        return {
            "cycle_number": self.cycle_count,
            "timestamp": self.last_cycle.isoformat(),
            "twin_snapshot": twin_snapshot,
            "decision": decision,
        }