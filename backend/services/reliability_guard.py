"""Critical-Load Reliability Guard — protects critical buildings (labs, hostels) during shortfalls.

This module computes hard constraints that ALL optimization candidates must satisfy:
  1. Battery reserve floor: minimum SoC = (critical_load × 2h) / battery_capacity
  2. Load shedding priority: non-critical shed first, critical never shed
  3. Emergency mode: if SoC falls below absolute minimum, shed ALL non-critical load

The Reliability Guard is a CONSTRAINT, not an optimizer. It filters candidates,
not scores them.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

from backend.config import settings
from backend.services.forecast_engine import FullForecast

logger = logging.getLogger(__name__)


@dataclass
class ReliabilityConstraints:
    """Hard constraints that all optimization candidates must satisfy."""
    reserve_floor_pct: float = settings.battery_min_soc_pct  # Min battery SoC to never go below
    critical_load_kw: float = 0.0             # Total critical load across campus (kW)
    non_critical_load_kw: float = 0.0         # Total non-critical load (kW)
    shedding_priority: list[dict] = field(default_factory=list)  # [{building_id, tier, priority}]
    emergency_mode: bool = False
    shortfall_predicted_kwh: float = 0.0      # Predicted deficit in next 2h
    reserve_duration_hours: float = 2.0       # How many hours critical load must be supported

    def to_dict(self) -> dict:
        return {
            "reserve_floor_pct": round(self.reserve_floor_pct, 1),
            "critical_load_kw": round(self.critical_load_kw, 2),
            "non_critical_load_kw": round(self.non_critical_load_kw, 2),
            "shedding_priority": self.shedding_priority,
            "emergency_mode": self.emergency_mode,
            "shortfall_predicted_kwh": round(self.shortfall_predicted_kwh, 2),
            "reserve_duration_hours": self.reserve_duration_hours,
        }


class ReliabilityGuard:
    """Computes reliability constraints and load shedding priorities.

    Key principle: critical buildings (labs, hostels) must NEVER lose power.
    If a shortfall occurs, non-critical load (admin, sports) sheds first.
    """

    ABSOLUTE_MIN_SOC = 10.0  # Emergency cutoff — battery never goes below 10%
    RESERVE_DURATION_HOURS = 2.0  # Battery must support critical load for 2 hours

    def __init__(self):
        self.last_constraints: ReliabilityConstraints | None = None

    async def compute_constraints(self, twin_snapshot: dict, forecast: FullForecast | None = None) -> ReliabilityConstraints:
        """Compute reliability constraints based on current state and forecast.

        Args:
            twin_snapshot: Current building/turbine/battery state
            forecast: 24h forecast of solar, wind, demand

        Returns:
            ReliabilityConstraints with hard limits for all optimizers
        """
        # Filter to only building data (exclude turbines, batteries, timestamp)
        building_keys = [k for k, v in twin_snapshot.items()
                         if isinstance(v, dict) and not k.startswith("turbine_")
                         and not k.startswith("battery_") and k != "timestamp"]
        buildings = {bid: twin_snapshot[bid] for bid in building_keys}
        batteries = {k: v for k, v in twin_snapshot.items()
                     if k.startswith("battery_") and isinstance(v, dict)}

        # Aggregate critical and non-critical loads
        critical_load_kw = 0.0
        non_critical_load_kw = 0.0
        shedding_priority = []

        # Use forecast peak demand if available, otherwise fall back to current
        forecast_peaks = {}
        if forecast:
            for bid, demand_fc in forecast.demand.items():
                if demand_fc.values:
                    forecast_peaks[bid] = max(demand_fc.values)

        for bid, bdata in buildings.items():
            if not isinstance(bdata, dict):
                continue
            tier = bdata.get("criticality_tier", "non_critical")
            consumption_kwh = bdata.get("consumption_kwh", 0)
            current_kw = consumption_kwh * 12.0  # Convert 5-min kWh to kW

            # Use forecast peak if available, otherwise current consumption
            peak_kw = forecast_peaks.get(bid, current_kw)

            entry = {
                "building_id": bid,
                "criticality_tier": tier,
                "current_load_kw": round(current_kw, 2),
                "peak_load_kw": round(peak_kw, 2),
                "priority": 1 if tier == "non_critical" else 2,  # 1 = shed first, 2 = protect
            }
            shedding_priority.append(entry)

            if tier == "critical":
                critical_load_kw += peak_kw
            else:
                non_critical_load_kw += peak_kw

        # Find the battery with lowest SoC
        min_soc = 100.0
        total_battery_capacity = 0.0
        for bid, battery in batteries.items():
            if isinstance(battery, dict):
                min_soc = min(min_soc, battery.get("soc_pct", 50))
                total_battery_capacity += battery.get("capacity_kwh", 0)

        # Compute reserve floor: battery must support critical load for RESERVE_DURATION_HOURS
        if total_battery_capacity > 0:
            # Critical energy needed = critical_load_kw × duration × (1/discharge_efficiency)
            critical_energy_kwh = critical_load_kw * self.RESERVE_DURATION_HOURS / 0.95
            reserve_floor_pct = max(
                self.ABSOLUTE_MIN_SOC,
                (critical_energy_kwh / total_battery_capacity) * 100.0,
            )
            # Cap at 60% — if reserve floor is too high, we're over-provisioned
            reserve_floor_pct = min(reserve_floor_pct, 60.0)
        else:
            reserve_floor_pct = self.ABSOLUTE_MIN_SOC

        # Check for predicted shortfall using forecast
        shortfall = 0.0
        emergency = False
        if forecast and forecast.demand:
            # Look at next 6 hours (72 intervals at 5 min = 12 per hour)
            first_demand = next(iter(forecast.demand.values()))
            horizon = min(72, len(first_demand.values) if first_demand.values else 0)
            for bid, demand_fc in forecast.demand.items():
                solar_fc = forecast.solar.get(bid)
                wind_fc = forecast.wind.get(bid)

                if solar_fc and wind_fc and demand_fc.values:
                    gen = sum(solar_fc.values[:horizon]) + sum(wind_fc.values[:horizon])
                    dem = sum(demand_fc.values[:horizon])
                    deficit = dem - gen
                    if deficit > 0:
                        shortfall += deficit

            # Check battery against reserve floor
            current_soc = min_soc
            energy_at_risk = (reserve_floor_pct / 100.0) * total_battery_capacity
            if shortfall > energy_at_risk and current_soc < reserve_floor_pct:
                emergency = True

        # Sort shedding priority: non-critical first (priority 2), then critical (priority 1)
        shedding_priority.sort(key=lambda x: x["priority"])

        constraints = ReliabilityConstraints(
            reserve_floor_pct=round(reserve_floor_pct, 1),
            critical_load_kw=round(critical_load_kw, 2),
            non_critical_load_kw=round(non_critical_load_kw, 2),
            shedding_priority=shedding_priority,
            emergency_mode=emergency,
            shortfall_predicted_kwh=round(shortfall, 2),
            reserve_duration_hours=self.RESERVE_DURATION_HOURS,
        )

        self.last_constraints = constraints

        if emergency:
            logger.warning(f"EMERGENCY MODE: Shortfall={shortfall:.1f} kWh, critical load={critical_load_kw:.1f} kW")
        else:
            logger.info(f"Reliability: reserve_floor={reserve_floor_pct:.1f}%, critical={critical_load_kw:.1f}kW, "
                        f"non_critical={non_critical_load_kw:.1f}kW")

        return constraints

    def is_candidate_safe(self, candidate_battery_soc: float, shed_critical: bool, battery_action: str = "hold") -> bool:
        """Check if a candidate strategy violates reliability constraints.

        Key principle: only reject DISCHARGE actions that would bring SoC below
        the reserve floor. Charge/hold/reserve actions are always safe because
        they don't deplete the battery further — they either improve SoC or hold
        steady, buying time for generation to recover.

        Args:
            candidate_battery_soc: Estimated SoC after this action executes
            shed_critical: Whether this candidate sheds critical load
            battery_action: The battery action being evaluated ("discharge", "charge_rapid", etc.)
        """
        if self.last_constraints is None:
            return True
        if shed_critical:
            return False  # Never shed critical load, under any circumstances
        if candidate_battery_soc < self.ABSOLUTE_MIN_SOC:
            return False  # Absolute emergency cutoff
        # Only reject discharge actions that would violate the reserve floor
        if battery_action == "discharge" and candidate_battery_soc < self.last_constraints.reserve_floor_pct:
            return False
        return True
