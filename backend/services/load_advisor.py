"""Demand-Side Load Advisor — recommends optimal windows for flexible loads.

Given a 24h forecast, this module identifies:
  • Best windows to run energy-intensive activities (workshops, HVAC) — when
    renewable surplus is high and tariff is low
  • Worst windows to avoid — when deficit is high and tariff peaks

This directly answers the PS requirement: "load-shifting opportunities."
"""
from __future__ import annotations
import math
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional

from backend.services.forecast_engine import FullForecast

logger = logging.getLogger(__name__)


@dataclass
class LoadShiftWindow:
    """A recommended time window for flexible load operation."""
    start_time: str
    end_time: str
    building_id: str
    recommendation: str  # "optimal", "good", "avoid", "critical"
    reason: str
    expected_surplus_kwh: float = 0.0
    expected_deficit_kwh: float = 0.0
    tariff_multiplier: float = 1.0


@dataclass
class LoadShiftAdvice:
    """Complete load-shift advice for the next 24 hours."""
    building_id: str
    windows: list[LoadShiftWindow] = field(default_factory=list)
    best_window: Optional[LoadShiftWindow] = None
    worst_window: Optional[LoadShiftWindow] = None
    total_surplus_kwh: float = 0.0
    total_deficit_kwh: float = 0.0

    def to_dict(self) -> dict:
        return {
            "building_id": self.building_id,
            "best_window": self.best_window.__dict__ if self.best_window else None,
            "worst_window": self.worst_window.__dict__ if self.worst_window else None,
            "windows": [w.__dict__ for w in self.windows],
            "total_surplus_kwh": round(self.total_surplus_kwh, 2),
            "total_deficit_kwh": round(self.total_deficit_kwh, 2),
        }


class LoadShiftAdvisor:
    """Analyzes 24h forecast to recommend when to run flexible loads.

    Flexible loads: workshops (welding, 3D printers), HVAC, water heating, EV charging.
    These can be shifted by ±2 hours with minimal impact on building operations.
    """

    # Time-of-use tariff profile (Rajasthan DISCOM typical)
    PEAK_HOURS = [17, 18, 19, 20]      # 5pm-9pm: highest rates
    PARTIAL_PEAK = [8, 9, 10, 11, 12, 13, 14, 15]  # 8am-3pm
    OFF_PEAK = list(range(0, 8)) + list(range(16, 17)) + list(range(21, 24))  # Night + midday lull
    SUPER_OFF_PEAK = [1, 2, 3, 4, 5, 6]  # 1am-6am: lowest rates

    def __init__(self, interval_minutes: int = 5):
        self.interval_minutes = interval_minutes

    async def advise(self, forecast: FullForecast, building_id: str, tariff: float = 9.0) -> LoadShiftAdvice:
        """Generate load-shift advice for a specific building.

        Args:
            forecast: 24h forecast from ForecastEngine
            building_id: Which building to advise for
            tariff: Current tariff rate (INR/kWh)

        Returns:
            LoadShiftAdvice with optimal and worst windows
        """
        solar = forecast.solar.get(building_id)
        wind = forecast.wind.get(building_id)
        demand = forecast.demand.get(building_id)

        if not solar or not wind or not demand:
            return LoadShiftAdvice(building_id=building_id, windows=[])

        windows = []
        total_surplus = 0.0
        total_deficit = 0.0
        best_window = None
        worst_window = None
        best_score = -999
        worst_score = 999

        n = len(demand.values)
        for i in range(n - 11):  # 1-hour windows (12 × 5-min intervals)
            window_start_dt = datetime.fromisoformat(demand.timestamps[i])

            # Sum generation and demand over 1-hour window
            gen_window = sum(solar.values[i:i+12]) + sum(wind.values[i:i+12])
            dem_window = sum(demand.values[i:i+12])
            net = gen_window - dem_window

            # Tariff multiplier based on time-of-use
            hour = window_start_dt.hour
            if hour in self.SUPER_OFF_PEAK:
                tariff_mult = 0.5
            elif hour in self.OFF_PEAK:
                tariff_mult = 0.8
            elif hour in self.PARTIAL_PEAK:
                tariff_mult = 1.0
            else:  # PEAK
                tariff_mult = 1.8

            # Score: high surplus + low tariff = good for flexible loads
            score = (net * 10.0) - (tariff_mult * 50.0)  # Weight surplus positively, tariff negatively

            if net > 0:
                total_surplus += net
            else:
                total_deficit += abs(net)

            # Classify
            if net > 30 and tariff_mult <= 0.8:
                rec = "optimal"
                reason = f"High renewable surplus ({net:.1f} kWh) + low tariff period"
            elif net > 10 and tariff_mult <= 1.0:
                rec = "good"
                reason = f"Moderate surplus ({net:.1f} kWh), favorable tariff"
            elif net < -20:
                rec = "avoid"
                reason = f"Deficit of {abs(net):.1f} kWh — avoid energy-intensive loads"
            elif tariff_mult >= 1.8:
                rec = "avoid"
                reason = f"Peak tariff period (×{tariff_mult:.1f}) — defer loads"
            else:
                rec = "neutral"
                reason = f"Net {'surplus' if net > 0 else 'deficit'} of {net:.1f} kWh"

            window = LoadShiftWindow(
                start_time=window_start_dt.isoformat(),
                end_time=(window_start_dt + timedelta(hours=1)).isoformat(),
                building_id=building_id,
                recommendation=rec,
                reason=reason,
                expected_surplus_kwh=round(net if net > 0 else 0, 2),
                expected_deficit_kwh=round(abs(net) if net < 0 else 0, 2),
                tariff_multiplier=tariff_mult,
            )
            windows.append(window)

            if score > best_score and rec in ("optimal", "good"):
                best_score = score
                best_window = window
            if score < worst_score and rec == "avoid":
                worst_score = score
                worst_window = window

        return LoadShiftAdvice(
            building_id=building_id,
            windows=windows,
            best_window=best_window,
            worst_window=worst_window,
            total_surplus_kwh=round(total_surplus, 2),
            total_deficit_kwh=round(total_deficit, 2),
        )
