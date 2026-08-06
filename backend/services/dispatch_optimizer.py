"""Energy Dispatch Optimizer — determines physical routing of energy.

Decision: solar + wind → load → battery → export → diesel

For each candidate strategy, produces a dispatch plan describing how energy
flows through the system. The Cost and Carbon engines then score each plan.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

from backend.services.forecast_engine import FullForecast
from backend.services.reliability_guard import ReliabilityConstraints

logger = logging.getLogger(__name__)


@dataclass
class DispatchCandidate:
    """A candidate dispatch strategy for one building."""
    building_id: str
    strategy: str  # "prioritize_self_consumption", "maximize_export", "minimize_grid_import", "auto"
    solar_self_used_kw: float = 0.0
    solar_exported_kw: float = 0.0
    wind_self_used_kw: float = 0.0
    wind_exported_kw: float = 0.0
    battery_charge_kw: float = 0.0
    battery_discharge_kw: float = 0.0
    grid_import_kw: float = 0.0
    grid_export_kw: float = 0.0
    shed_non_critical_kw: float = 0.0
    confidence_pct: float = 0.0
    reason: str = ""
    details: dict = field(default_factory=dict)


class DispatchOptimizer:
    """Generates and scores dispatch strategy candidates.

    Produces multiple routing strategies per building:
      • self_consumption: Maximize on-site use of solar+wind before export
      • export_max: Export surplus to maximize VNM/GNM credits
      • grid_min: Minimize grid import (preserve battery for later)
      • auto: Let the cost/carbon engines pick
    """

    def __init__(self):
        self.strategies = ["self_consumption", "export_max", "grid_min", "auto"]

    async def generate_candidates(
        self,
        twin_snapshot: dict,
        forecast: FullForecast,
        constraints: ReliabilityConstraints,
        building_id: str,
    ) -> list[DispatchCandidate]:
        """Generate dispatch candidates for a single building."""
        building = twin_snapshot.get(building_id, {})
        if not building:
            return []

        solar_kw = building.get("solar_generation_kwh", 0) * 12.0
        wind_kw = building.get("wind_generation_kwh", 0) * 12.0
        demand_kw = building.get("consumption_kwh", 0) * 12.0
        battery_soc = building.get("battery_soc_pct", 50)
        criticality = building.get("criticality_tier", "non_critical")

        total_gen = solar_kw + wind_kw
        candidates = []

        for strategy in self.strategies:
            if strategy == "self_consumption":
                # Maximize on-site consumption, export minimal
                self_used = min(total_gen, demand_kw + 0.1 * total_gen)
                exported = total_gen - self_used
                battery_charge = min(0.9 * (total_gen - self_used), building.get("battery_charge_max_kw", 50))
                exported -= battery_charge * 0.95  # Battery absorbs some
                exported = max(0, exported)
                battery_discharge = 0  # Only discharge on deficit
                grid_import = max(0, demand_kw - total_gen - battery_discharge)
                grid_export = exported
                confidence = 0.75
                reason = f"Maximize self-consumption: {self_used:.1f}kW of {total_gen:.1f}kW generated used on-site"

            elif strategy == "export_max":
                # Export as much as possible for VNM/GNM credits
                self_used = min(total_gen, demand_kw)
                exported = total_gen - self_used
                battery_charge = min(0.8 * exported, building.get("battery_charge_max_kw", 50))
                exported -= battery_charge * 0.95
                grid_import = max(0, demand_kw - total_gen)
                grid_export = max(0, exported)
                confidence = 0.70
                reason = f"Maximize export: {grid_export:.1f}kW exported for VNM credits"

            elif strategy == "grid_min":
                # Minimize grid import — use battery aggressively
                grid_import = max(0, demand_kw - total_gen - 50)  # Assume up to 50kW from battery
                self_used = min(total_gen, demand_kw)
                battery_discharge = min(50, demand_kw - total_gen) if demand_kw > total_gen else 0
                battery_charge = max(0, (total_gen - demand_kw) * 0.85) if total_gen > demand_kw else 0
                exported = max(0, total_gen - self_used - battery_charge * 0.95)
                grid_export = exported
                confidence = 0.80
                reason = f"Minimize grid import: only {grid_import:.1f}kW imported, battery supplies deficit"

            else:  # auto
                # Balanced approach
                if total_gen > demand_kw:
                    # Surplus — charge battery, export remainder
                    self_used = demand_kw
                    battery_charge = min(0.7 * (total_gen - demand_kw), 50)
                    grid_export = total_gen - self_used - battery_charge * 0.95
                    grid_import = 0
                    battery_discharge = 0
                    confidence = 0.85
                    reason = "Surplus detected: battery charging + limited export"
                else:
                    # Deficit — use battery, import remainder
                    deficit = demand_kw - total_gen
                    battery_discharge = min(deficit, 50, battery_soc / 100.0 * 50)
                    grid_import = max(0, deficit - battery_discharge)
                    self_used = total_gen
                    grid_export = 0
                    battery_charge = 0
                    confidence = 0.82
                    reason = f"Deficit of {deficit:.1f}kW: battery supplies {battery_discharge:.1f}kW, grid {grid_import:.1f}kW"

            candidate = DispatchCandidate(
                building_id=building_id,
                strategy=strategy,
                solar_self_used_kw=round(self_used * (solar_kw / max(0.01, total_gen)), 2) if total_gen > 0 else 0,
                solar_exported_kw=round(exported * (solar_kw / max(0.01, total_gen)), 2) if total_gen > 0 else 0,
                wind_self_used_kw=round(self_used * (wind_kw / max(0.01, total_gen)), 2) if total_gen > 0 else 0,
                wind_exported_kw=round(exported * (wind_kw / max(0.01, total_gen)), 2) if total_gen > 0 else 0,
                battery_charge_kw=round(battery_charge, 2),
                battery_discharge_kw=round(battery_discharge, 2),
                grid_import_kw=round(grid_import, 2),
                grid_export_kw=round(grid_export, 2),
                shed_non_critical_kw=0,  # Reliability guard handles shedding separately
                confidence_pct=round(confidence * 100, 1),
                reason=reason,
                details={
                    "criticality": criticality,
                    "solar_kw": round(solar_kw, 2),
                    "wind_kw": round(wind_kw, 2),
                    "demand_kw": round(demand_kw, 2),
                    "total_gen": round(total_gen, 2),
                    "net_load": round(demand_kw - total_gen, 2),
                },
            )

            candidates.append(candidate)

        return candidates
