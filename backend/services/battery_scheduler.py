"""AI Battery Charge Scheduler — decides charge/discharge/hold/reserve for each battery.

Decision logic:
  • If surplus (gen > demand) and SoC < 95% → CHARGE (rapid if high surplus, slow if low)
  • If deficit (gen < demand) and SoC > reserve_floor → DISCHARGE
  • If SoC near max or near reserve floor → HOLD
  • If SoC near reserve floor and deficit predicted → RESERVE (stop all discharge)

Input: SoC, health, temperature, solar+wind forecast, demand forecast, tariff, reserve floor
Output: charge / discharge / hold / charge-slow / charge-rapid / reserve
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

from backend.config import settings
from backend.services.forecast_engine import FullForecast
from backend.services.reliability_guard import ReliabilityConstraints

logger = logging.getLogger(__name__)


@dataclass
class BatteryCandidate:
    """A candidate battery management strategy for one battery."""
    battery_id: str
    building_id: str
    action: str  # "charge_rapid", "charge_slow", "discharge", "hold", "reserve"
    target_soc_pct: float
    charge_rate_kw: float = 0.0
    discharge_rate_kw: float = 0.0
    reason: str = ""
    confidence_pct: float = 0.0
    details: dict = field(default_factory=dict)


class BatteryChargeScheduler:
    """Schedules battery charge/discharge decisions based on forecasts and constraints."""

    SOC_MAX: float = settings.battery_max_soc_pct

    def __init__(self):
        self.actions = ["charge_rapid", "charge_slow", "discharge", "hold", "reserve"]

    async def generate_candidates(
        self,
        twin_snapshot: dict,
        forecast: FullForecast,
        constraints: ReliabilityConstraints,
        building_id: str,
    ) -> list[BatteryCandidate]:
        """Generate battery management candidates for all batteries in a building."""
        battery_key = f"battery_{building_id}"
        battery = twin_snapshot.get(battery_key, {})

        if not battery:
            return []

        soc = battery.get("soc_pct", 50)
        capacity = battery.get("capacity_kwh", 200)
        charge_max = battery.get("charge_rate_max_kw", 50)
        discharge_max = battery.get("discharge_rate_max_kw", 50)
        reserve_floor = constraints.reserve_floor_pct

        solar_kw = twin_snapshot.get(building_id, {}).get("solar_generation_kwh", 0) * 12.0
        wind_kw = twin_snapshot.get(building_id, {}).get("wind_generation_kwh", 0) * 12.0
        demand_kw = twin_snapshot.get(building_id, {}).get("consumption_kwh", 0) * 12.0

        total_gen = solar_kw + wind_kw
        net = total_gen - demand_kw  # Positive = surplus, negative = deficit

        # Get forecast trend
        solar_fc = forecast.solar.get(building_id)
        wind_fc = forecast.wind.get(building_id)
        demand_fc = forecast.demand.get(building_id)

        # Predict next 2-hour surplus/deficit
        future_gen = 0.0
        future_demand = 0.0
        if solar_fc and wind_fc and demand_fc:
            horizon = min(24, len(solar_fc.values))  # Next 2 hours
            future_gen = sum(solar_fc.values[:horizon]) + sum(wind_fc.values[:horizon])
            future_demand = sum(demand_fc.values[:horizon])

        future_surplus = future_gen - future_demand

        candidates = []

        # Candidate 1: Charge rapid (if surplus now + future)
        if net > 0 and soc < self.SOC_MAX and future_surplus >= 0:
            rate = min(charge_max, net * 0.9)
            target_soc = min(self.SOC_MAX, soc + (rate * 5 / 60.0 / capacity) * 100)
            candidates.append(BatteryCandidate(
                battery_id=battery.get("battery_id", battery_key),
                building_id=building_id,
                action="charge_rapid",
                target_soc_pct=round(target_soc, 1),
                charge_rate_kw=round(rate, 2),
                reason=f"Surplus {net:.1f}kW now + forecast {future_surplus:.1f}kWh in 2h. Charging to {target_soc:.0f}%.",
                confidence_pct=85,
                details={"soc": soc, "net": net, "future_surplus": future_surplus},
            ))

        # Candidate 2: Charge slow (if small surplus)
        if 0 < net < charge_max * 0.5 and soc < self.SOC_MAX:
            rate = min(charge_max * 0.3, net * 0.8)
            target_soc = min(self.SOC_MAX, soc + (rate * 5 / 60.0 / capacity) * 100)
            candidates.append(BatteryCandidate(
                battery_id=battery.get("battery_id", battery_key),
                building_id=building_id,
                action="charge_slow",
                target_soc_pct=round(target_soc, 1),
                charge_rate_kw=round(rate, 2),
                reason=f"Small surplus {net:.1f}kW. Slow charging to {target_soc:.0f}%.",
                confidence_pct=80,
                details={"soc": soc, "net": net},
            ))

        # Candidate 3: Discharge (if deficit and SoC above reserve)
        if net < 0 and soc > reserve_floor + 5:
            deficit = -net
            rate = min(discharge_max, deficit, (soc - reserve_floor) / 100.0 * capacity * 0.5)
            soc_after = max(reserve_floor, soc - (rate * 5 / 60.0 / capacity) * 100)
            candidates.append(BatteryCandidate(
                battery_id=battery.get("battery_id", battery_key),
                building_id=building_id,
                action="discharge",
                target_soc_pct=round(soc_after, 1),
                discharge_rate_kw=round(rate, 2),
                reason=f"Deficit {deficit:.1f}kW. Discharging {rate:.1f}kW to support demand. SoC: {soc:.0f}%→{soc_after:.0f}%.",
                confidence_pct=82,
                details={"soc": soc, "deficit": deficit, "reserve_floor": reserve_floor},
            ))

        # Candidate 4: Hold (balanced or SoC at limits)
        if abs(net) < 5 or soc >= self.SOC_MAX - 2 or soc <= reserve_floor + 2:
            candidates.append(BatteryCandidate(
                battery_id=battery.get("battery_id", battery_key),
                building_id=building_id,
                action="hold",
                target_soc_pct=round(soc, 1),
                reason=f"Balanced operation. Holding at {soc:.0f}% SoC.",
                confidence_pct=90,
                details={"soc": soc, "net": net, "reserve_floor": reserve_floor},
            ))

        # Candidate 5: Reserve (if deficit forecast and SoC near floor)
        if net < 0 and soc <= reserve_floor + 10:
            candidates.append(BatteryCandidate(
                battery_id=battery.get("battery_id", battery_key),
                building_id=building_id,
                action="reserve",
                target_soc_pct=round(soc, 1),
                reason=f"SoC near reserve floor ({soc:.0f}% ≤ {reserve_floor:.0f}%). RESERVE mode — no further discharge.",
                confidence_pct=95,
                details={"soc": soc, "reserve_floor": reserve_floor, "future_deficit": future_surplus < 0},
            ))

        return candidates
