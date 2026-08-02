"""AI Global Optimization Engine — Decision Manager.

This is the brain of the VPP. Every 5 minutes, it:

1.  Reads sensors via the adapter layer
2.  Updates the Digital Twin
3.  Forecasts next 24h: solar, wind, demand
4.  Computes battery reserve floor (Reliability Guard)
5.  Evaluates load-shift opportunities (Load Advisor)
6.  Generates dispatch × battery × VNM × load-shift candidates
7.  Scores each by cost + carbon (weighted), discards constraint violators
8.  Selects the highest-scoring strategy, executes it, logs the decision

Architecture: each of the 8 modules is an independent service. The Decision
Manager orchestrates them without tight coupling — modules can be upgraded
(e.g., rule-based → Pyomo LP) without touching the orchestration logic.
"""
from __future__ import annotations
import json
import logging
import math
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Any
from dataclasses import dataclass, field

from backend.adapters.base import EnergyAdapter
from backend.adapters.simulated import SimulatedAdapter
from backend.simulator.battery_model import BatteryModel
from backend.services.forecast_engine import ForecastEngine, FullForecast
from backend.services.reliability_guard import ReliabilityGuard, ReliabilityConstraints
from backend.services.load_advisor import LoadShiftAdvisor, LoadShiftAdvice
from backend.services.dispatch_optimizer import DispatchOptimizer, DispatchCandidate
from backend.services.battery_scheduler import BatteryChargeScheduler, BatteryCandidate
from backend.services.vnm_optimizer import VnmOptimizer, VnmCandidate
from backend.services.cost_optimizer import CostOptimizer
from backend.services.carbon_optimizer import CarbonOptimizer
from backend.models.decision_log import DecisionLog
from backend.ws.websocket_manager import ConnectionManager

logger = logging.getLogger(__name__)


@dataclass
class DecisionResult:
    """The final decision produced by the Decision Manager."""
    decision_id: str
    timestamp: str
    decision_type: str  # "dispatch" | "battery" | "load_shift" | "reliability" | "vnm"
    action: str
    confidence_pct: float
    reason: str
    alternative_considered: str
    expected_savings_inr: float
    expected_carbon_reduction_kg: float
    building_id: Optional[str]
    battery_soc_after_pct: float
    context: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "decision_id": self.decision_id,
            "timestamp": self.timestamp,
            "decision_type": self.decision_type,
            "action": self.action,
            "confidence_pct": round(self.confidence_pct, 1),
            "reason": self.reason,
            "alternative_considered": self.alternative_considered,
            "expected_savings_inr": round(self.expected_savings_inr, 2),
            "expected_carbon_reduction_kg": round(self.expected_carbon_reduction_kg, 4),
            "building_id": self.building_id,
            "battery_soc_after_pct": round(self.battery_soc_after_pct, 1),
            "context": self.context,
        }


@dataclass
class ScoredStrategy:
    """A fully evaluated strategy candidate with cost, carbon, and composite score."""
    building_id: str
    dispatch: DispatchCandidate
    battery: BatteryCandidate
    vnm_allocation: dict
    load_shift: Optional[dict]
    cost_inr: float
    carbon_kg: float
    normalized_cost: float
    normalized_carbon: float
    reliability_ok: bool
    composite_score: float
    reason: str
    alternative_considered: str
    confidence_pct: float


class DecisionManager:
    """Orchestrates the 8 AI modules and produces scored, explainable decisions.

    Design principle: the Decision Manager does NOT implement optimization logic
    itself. It coordinates independent modules (each with its own testable logic),
    then applies a weighted scoring filter. This separation means any module can
    be swapped for a more sophisticated version (e.g., ML-based forecasting)
    without changing the orchestration.
    """

    def __init__(
        self,
        adapter: EnergyAdapter,
        ws_manager: ConnectionManager,
        cost_weight: float = 0.7,
        carbon_weight: float = 0.3,
    ):
        self.adapter = adapter
        self.ws_manager = ws_manager
        self.cost_weight = cost_weight
        self.carbon_weight = carbon_weight

        # Initialize all 8 AI modules
        self.forecast_engine = ForecastEngine()
        self.reliability_guard = ReliabilityGuard()
        self.load_advisor = LoadShiftAdvisor()
        self.dispatch_optimizer = DispatchOptimizer()
        self.battery_scheduler = BatteryChargeScheduler()
        self.vnm_optimizer = VnmOptimizer(
            sell_rate_inr=5.0,  # Will be updated from config
        )
        self.cost_optimizer = CostOptimizer(
            tariff_buy=9.0,
            tariff_sell=5.0,
        )
        self.carbon_optimizer = CarbonOptimizer()

        self.decision_count = 0

    async def run_cycle(self, twin_snapshot: dict) -> Optional[dict]:
        """Execute the full 5-minute decision cycle.

        Returns a summary of the best decision for each building, or None
        if no decisions were made.
        """
        cycle_start = datetime.now(timezone.utc)
        self.decision_count += 1

        forecast, constraints, buildings = await self._prepare_cycle_data(twin_snapshot)
        all_strategies = await self._evaluate_strategies(twin_snapshot, forecast, constraints, buildings)
        best_per_building = self._select_best_strategies(all_strategies)
        decisions = await self._execute_and_broadcast_decisions(
            cycle_start, twin_snapshot, constraints, best_per_building, all_strategies
        )

        logger.info(f"Decision cycle {self.decision_count} complete: "
                     f"{len(decisions)} decisions, "
                     f"strategies evaluated: {len(all_strategies)}")

        return {
            "cycle_number": self.decision_count,
            "timestamp": cycle_start.isoformat(),
            "decisions": [d.to_dict() for d in decisions],
            "strategies_evaluated": len(all_strategies),
            "reliability": constraints.to_dict(),
        }

    async def _prepare_cycle_data(self, twin_snapshot: dict) -> tuple:
        """Run forecast, compute constraints, and extract building data."""
        forecast = await self.forecast_engine.forecast(twin_snapshot)
        constraints = await self.reliability_guard.compute_constraints(twin_snapshot, forecast)
        buildings = {k: v for k, v in twin_snapshot.items()
                     if not k.startswith("turbine_") and not k.startswith("battery_") and k != "timestamp"
                     and isinstance(v, dict)}
        return forecast, constraints, buildings

    async def _evaluate_strategies(
        self,
        twin_snapshot: dict,
        forecast: FullForecast,
        constraints: ReliabilityConstraints,
        buildings: dict,
    ) -> list[ScoredStrategy]:
        """Generate, score, and normalize all candidate strategies across all buildings."""
        all_strategies: list[ScoredStrategy] = []

        for bid, bdata in buildings.items():
            if not isinstance(bdata, dict):
                continue
            strategies = await self._evaluate_building_strategies(
                twin_snapshot, forecast, constraints, bid, bdata
            )
            all_strategies.extend(strategies)

        if all_strategies:
            self._normalize_strategies(all_strategies)

        return all_strategies

    async def _evaluate_building_strategies(
        self,
        twin_snapshot: dict,
        forecast: FullForecast,
        constraints: ReliabilityConstraints,
        bid: str,
        bdata: dict,
    ) -> list[ScoredStrategy]:
        """Generate and score all strategy candidates for a single building."""
        dispatch_candidates = await self.dispatch_optimizer.generate_candidates(
            twin_snapshot, forecast, constraints, bid
        )
        battery_candidates = await self.battery_scheduler.generate_candidates(
            twin_snapshot, forecast, constraints, bid
        )
        load_advice = await self.load_advisor.advise(
            forecast, bid, tariff=bdata.get("tariff_inr_per_unit", 9.0)
        )

        strategies: list[ScoredStrategy] = []
        for dispatch in dispatch_candidates:
            for battery in battery_candidates:
                cost_result = await self.cost_optimizer.score_candidate(dispatch, bid, twin_snapshot)
                carbon_result = await self.carbon_optimizer.score_candidate(dispatch, bid, twin_snapshot)

                cost_inr = cost_result["cost_inr"] if isinstance(cost_result, dict) else cost_result
                carbon_kg = carbon_result["carbon_kg"] if isinstance(carbon_result, dict) else carbon_result

                soc_after = self._estimate_soc_after(bdata, battery, dispatch)
                shed_critical = False
                reliability_ok = self.reliability_guard.is_candidate_safe(
                    soc_after, shed_critical, battery.action
                )

                if not reliability_ok:
                    continue

                strategy = ScoredStrategy(
                    building_id=bid,
                    dispatch=dispatch,
                    battery=battery,
                    vnm_allocation={},
                    load_shift=load_advice.best_window.__dict__ if load_advice.best_window else None,
                    cost_inr=cost_inr,
                    carbon_kg=carbon_kg,
                    normalized_cost=0,
                    normalized_carbon=0,
                    reliability_ok=reliability_ok,
                    composite_score=0,
                    reason="",
                    alternative_considered="",
                    confidence_pct=0,
                )
                strategies.append(strategy)

        return strategies

    def _normalize_strategies(self, strategies: list[ScoredStrategy]) -> None:
        """Normalize cost and carbon scores and compute composite scores."""
        costs = [s.cost_inr for s in strategies]
        carbons = [s.carbon_kg for s in strategies]
        normalized_costs = self.cost_optimizer.normalize_costs(costs)
        normalized_carbons = self.carbon_optimizer.normalize_carbons(carbons)

        for i, strategy in enumerate(strategies):
            strategy.normalized_cost = normalized_costs[i]
            strategy.normalized_carbon = normalized_carbons[i]
            strategy.composite_score = (
                self.cost_weight * strategy.normalized_cost +
                self.carbon_weight * strategy.normalized_carbon
            )
            strategy.reason = f"{strategy.dispatch.reason} | Battery: {strategy.battery.reason}"
            strategy.confidence_pct = min(
                strategy.dispatch.confidence_pct,
                strategy.battery.confidence_pct
            )

    def _select_best_strategies(self, all_strategies: list[ScoredStrategy]) -> dict[str, ScoredStrategy]:
        """Select the highest-scoring strategy per building."""
        best_per_building: dict[str, ScoredStrategy] = {}
        for strategy in all_strategies:
            bid = strategy.building_id
            if bid not in best_per_building or strategy.composite_score > best_per_building[bid].composite_score:
                best_per_building[bid] = strategy
        return best_per_building

    async def _execute_and_broadcast_decisions(
        self,
        cycle_start: datetime,
        twin_snapshot: dict,
        constraints: ReliabilityConstraints,
        best_per_building: dict[str, ScoredStrategy],
        all_strategies: list[ScoredStrategy],
    ) -> list[DecisionResult]:
        """Execute the best decisions via adapter, log them, and broadcast via WebSocket."""
        decisions: list[DecisionResult] = []

        for bid, best in best_per_building.items():
            alternative = self._find_alternative(all_strategies, best, bid)
            expected_savings = max(0, -best.cost_inr)
            expected_carbon_reduction = max(0, -best.carbon_kg)
            action_desc = self._build_action_description(best)

            decision = DecisionResult(
                decision_id=str(uuid.uuid4()),
                timestamp=cycle_start.isoformat(),
                decision_type="dispatch",
                action=action_desc,
                confidence_pct=best.confidence_pct,
                reason=best.reason,
                alternative_considered=(
                    f"{alternative.dispatch.strategy if alternative else 'N/A'}: "
                    f"{alternative.reason if alternative else 'No viable alternative'}"
                ),
                expected_savings_inr=round(expected_savings, 2),
                expected_carbon_reduction_kg=round(expected_carbon_reduction, 3),
                building_id=bid,
                battery_soc_after_pct=round(best.battery.target_soc_pct, 1),
                context={
                    "dispatch_strategy": best.dispatch.strategy,
                    "battery_action": best.battery.action,
                    "load_shift": best.load_shift,
                    "composite_score": round(best.composite_score, 4),
                    "cost_inr": round(best.cost_inr, 2),
                    "carbon_kg": round(best.carbon_kg, 3),
                },
            )

            if best.battery.action in ("charge_rapid", "charge_slow", "discharge", "hold", "reserve"):
                command = {
                    "target": f"battery_{bid}",
                    "action": best.battery.action,
                    "rate_kw": best.battery.charge_rate_kw if best.battery.charge_rate_kw > 0 else best.battery.discharge_rate_kw,
                }
                try:
                    await self.adapter.write_command(command)
                except Exception as e:
                    logger.warning(f"Failed to execute battery command for {bid}: {e}")

            if constraints.shortfall_predicted_kwh > 100:
                reliability_decision = DecisionResult(
                    decision_id=str(uuid.uuid4()),
                    timestamp=cycle_start.isoformat(),
                    decision_type="reliability",
                    action="protect_critical_loads",
                    confidence_pct=95.0,
                    reason=f"Reliability Guard activated: {constraints.shortfall_predicted_kwh:.1f} kWh "
                           f"shortfall predicted. Reserve floor set to {constraints.reserve_floor_pct:.1f}%. "
                           f"Non-critical buildings on shed list first.",
                    alternative_considered="Continue normal operation",
                    expected_savings_inr=0,
                    expected_carbon_reduction_kg=0,
                    building_id=bid,
                    battery_soc_after_pct=best.battery.target_soc_pct,
                    context={
                        "shortfall_kwh": constraints.shortfall_predicted_kwh,
                        "reserve_floor_pct": constraints.reserve_floor_pct,
                        "shedding_priority": constraints.shedding_priority[:2],
                    },
                )
                decisions.append(reliability_decision)

            # Add Load-Shift Advice if available
            if best.load_shift:
                load_decision = DecisionResult(
                    decision_id=str(uuid.uuid4()),
                    timestamp=cycle_start.isoformat(),
                    decision_type="load_shift",
                    action=f"Shift flexible load to {best.load_shift['start_time']}",
                    confidence_pct=85.0,
                    reason=best.load_shift.get("reason", "Optimal window for flexible load identified."),
                    alternative_considered="Keep current schedule",
                    expected_savings_inr=round(best.load_shift.get("expected_surplus_kwh", 0) * 5.0, 2),
                    expected_carbon_reduction_kg=round(best.load_shift.get("expected_surplus_kwh", 0) * 0.74, 3),
                    building_id=bid,
                    battery_soc_after_pct=best.battery.target_soc_pct,
                    context=best.load_shift,
                )
                decisions.append(load_decision)

            decisions.append(decision)

        # Add VNM Decisions (Campus-wide or per building)
        vnm_candidates = await self.vnm_optimizer.generate_candidates(twin_snapshot)
        if vnm_candidates:
            best_vnm = vnm_candidates[0]  # Take the first (proportional) for now
            for bid, alloc in best_vnm.allocations.items():
                if alloc.get("inr", 0) > 0:
                    vnm_decision = DecisionResult(
                        decision_id=str(uuid.uuid4()),
                        timestamp=cycle_start.isoformat(),
                        decision_type="vnm",
                        action=f"Allocate {alloc['kwh']} kWh VNM credits",
                        confidence_pct=best_vnm.confidence_pct,
                        reason=best_vnm.reason,
                        alternative_considered="Standard net metering",
                        expected_savings_inr=alloc["inr"],
                        expected_carbon_reduction_kg=round(alloc["kwh"] * 0.74, 3),
                        building_id=bid,
                        battery_soc_after_pct=0,  # Not applicable
                        context=alloc,
                    )
                    decisions.append(vnm_decision)

        # Broadcast all decisions
        for d in decisions:
            await self.ws_manager.send_to_all({
                "type": "decision",
                "data": d.to_dict(),
            })

        return decisions

    def _estimate_soc_after(self, building: dict, battery: BatteryCandidate, dispatch: DispatchCandidate) -> float:
        """Estimate battery SoC after this candidate's battery action."""
        current_soc = building.get("battery_soc_pct", 50.0)
        capacity = building.get("battery_capacity_kwh", 200.0)

        if battery.action in ("charge_rapid", "charge_slow"):
            charge_energy_kwh = battery.charge_rate_kw * (5 / 60.0) * BatteryModel.CHARGE_EFFICIENCY
            soc_delta = (charge_energy_kwh / capacity) * 100
            return min(100, current_soc + soc_delta)
        elif battery.action == "discharge":
            discharge_energy_kwh = battery.discharge_rate_kw * (5 / 60.0) / BatteryModel.DISCHARGE_EFFICIENCY
            soc_delta = (discharge_energy_kwh / capacity) * 100
            return max(0, current_soc - soc_delta)
        else:  # hold or reserve
            return current_soc

    def _find_alternative(
        self,
        all_strategies: list[ScoredStrategy],
        best: ScoredStrategy,
        building_id: str,
    ) -> Optional[ScoredStrategy]:
        """Find the second-best strategy for the same building."""
        building_strategies = [s for s in all_strategies if s.building_id == building_id and s is not best]
        if not building_strategies:
            return None
        return max(building_strategies, key=lambda s: s.composite_score)

    def _build_action_description(self, strategy: ScoredStrategy) -> str:
        """Build a plain-language action description for the technician UI."""
        b = strategy.battery
        d = strategy.dispatch

        if b.action == "charge_rapid":
            battery_action = f"Rapidly charging battery to {b.target_soc_pct:.0f}% using surplus renewable energy"
        elif b.action == "charge_slow":
            battery_action = f"Slowly charging battery to {b.target_soc_pct:.0f}% during low-demand period"
        elif b.action == "discharge":
            battery_action = f"Discharging {b.discharge_rate_kw:.1f}kW from battery to meet demand (SoC: →{b.target_soc_pct:.0f}%)"
        elif b.action == "reserve":
            battery_action = f"Putting battery in RESERVE mode — protecting critical loads at {b.target_soc_pct:.0f}% SoC"
        else:
            battery_action = f"Holding battery at {b.target_soc_pct:.0f}% SoC"

        surplus = d.details.get("net_load", 0)
        if surplus < 0:
            gen_desc = f"Export {abs(surplus):.1f}kW to grid (feed-in)"
        elif surplus > 0:
            gen_desc = f"Import {surplus:.1f}kW from grid"
        else:
            gen_desc = "Solar + wind fully meets demand"

        return f"{battery_action}. {gen_desc}."
