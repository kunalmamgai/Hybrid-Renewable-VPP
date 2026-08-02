"""Forecast Engine — produces 24h-ahead rolling forecasts.

Uses heuristic/statistical models:
  • Solar: irradiance model (clear sky + cloud cover) → PV curve
  • Wind: persistent forecast (current speed ± variability) → power curve
  • Demand: time-of-day + occupancy pattern

This is the MVP; Phase 3+ upgrade: XGBoost for solar, LSTM for wind/demand.
"""
from __future__ import annotations
import math
import logging
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from typing import Optional

from backend.simulator.solar_curve import SolarCurve
from backend.simulator.wind_curve import WindCurve
from backend.simulator.demand_curve import DemandCurve

logger = logging.getLogger(__name__)


@dataclass
class Forecast:
    """24-hour forecast for a single source."""
    timestamps: list[str] = field(default_factory=list)
    values: list[float] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {"timestamps": self.timestamps, "values": self.values}


@dataclass
class FullForecast:
    """Complete 24-hour forecast covering all energy sources and demand."""
    solar: dict[str, Forecast] = field(default_factory=dict)  # building_id -> Forecast
    wind: dict[str, Forecast] = field(default_factory=dict)   # turbine_id -> Forecast
    demand: dict[str, Forecast] = field(default_factory=dict) # building_id -> Forecast
    grid_emission: Forecast = field(default_factory=Forecast)

    def to_dict(self) -> dict:
        return {
            "solar": {k: v.to_dict() for k, v in self.solar.items()},
            "wind": {k: v.to_dict() for k, v in self.wind.items()},
            "demand": {k: v.to_dict() for k, v in self.demand.items()},
            "grid_emission": self.grid_emission.to_dict(),
        }


class ForecastEngine:
    """Generates 24h rolling forecasts for solar, wind, and demand per building."""

    def __init__(self, latitude: float = 26.9124, longitude: float = 75.7873):
        self.solar_curve = SolarCurve(latitude, longitude)
        self.wind_curve = WindCurve()
        self.demand_curve = DemandCurve()
        self.grid_emission_factor = 0.74  # kg CO2 / kWh — Rajasthan average
        self.forecast_horizon_hours = 24
        self.forecast_interval_minutes = 5

    async def forecast(self, twin_snapshot: dict, start_time: Optional[datetime] = None) -> FullForecast:
        """Produce 24h forecast from current twin state.

        Args:
            twin_snapshot: Current digital twin data (from adapter.read_sensors())
            start_time: Forecast start time (defaults to now + 5 min)

        Returns:
            FullForecast with 24h @ 5-min resolution for all sources
        """
        if start_time is None:
            start_time = datetime.now(timezone(timedelta(hours=5, minutes=30))) + timedelta(minutes=5)

        total_steps = (self.forecast_horizon_hours * 60) // self.forecast_interval_minutes

        forecast = FullForecast()

        # Filter to only building data (exclude turbines, batteries, timestamp)
        building_keys = [k for k, v in twin_snapshot.items()
                         if isinstance(v, dict) and not k.startswith("turbine_")
                         and not k.startswith("battery_") and k != "timestamp"]
        buildings = {bid: twin_snapshot[bid] for bid in building_keys}
        turbines = {k: v for k, v in twin_snapshot.items() if k.startswith("turbine_") and isinstance(v, dict)}
        batteries = {k: v for k, v in twin_snapshot.items() if k.startswith("battery_") and isinstance(v, dict)}

        # Forecast each building
        for bid, building_data in buildings.items():
            if not isinstance(building_data, dict):
                continue

            # Solar forecast
            solar_forecast = Forecast()
            # Use current cloud cover as base, persist forward with slight regression to mean
            current_irr = building_data.get("solar_generation_kwh", 0) * 12  # Convert to kW
            current_capacity = self._get_solar_capacity(bid, building_data)

            for i in range(total_steps):
                t = start_time + timedelta(minutes=i * self.forecast_interval_minutes)
                # Cloud cover regresses to scenario base over time
                cloud_cover = 0.2 + 0.15 * math.exp(-i / 50.0)  # Clears up over 250 min
                irr = self.solar_curve.irradiance(t, cloud_cover)
                solar_kw = current_capacity * (irr / 1000.0) * 0.85
                solar_forecast.timestamps.append(t.isoformat())
                solar_forecast.values.append(round(solar_kw, 2))

            forecast.solar[bid] = solar_forecast

            # Wind forecast (persistence + variability)
            wind_forecast = Forecast()
            turbine_key = f"turbine_{bid}"
            current_wind_speed = 5.5  # Default
            if turbine_key in turbines:
                current_wind_speed = turbines[turbine_key].get("wind_speed_mps", 5.5)

            wind_capacity = self._get_wind_capacity(bid, building_data)
            wind_curve = WindCurve(
                cut_in=3.5, rated=12.0, cut_out=25.0,
                rated_power_kw=wind_capacity,
            )

            for i in range(total_steps):
                t = start_time + timedelta(minutes=i * self.forecast_interval_minutes)
                # Wind persists with daily pattern (stronger at night)
                hour = t.hour
                night_boost = 1.2 if (22 <= hour or hour < 6) else 0.9
                gust = 0.3 * math.sin(i / 7.0)
                wind_speed = max(0, current_wind_speed * night_boost + gust)
                # Mean-revert toward 5.5 m/s over 6 hours
                wind_speed = 0.95 * wind_speed + 0.05 * 5.5
                wind_kw = wind_curve.rated_power_kw * wind_curve.power_output(wind_speed)
                wind_forecast.timestamps.append(t.isoformat())
                wind_forecast.values.append(round(wind_kw, 2))

            forecast.wind[bid] = wind_forecast

            # Demand forecast
            demand_forecast = Forecast()
            building_type = bid.split("_")[0] if "_" in bid else "academic"
            peak_demand = self._estimate_peak_demand(bid, building_data, current_capacity)

            for i in range(total_steps):
                t = start_time + timedelta(minutes=i * self.forecast_interval_minutes)
                occupancy = 0.3 if 18 <= t.hour or t.hour < 7 else 1.0
                if building_type == "admin":
                    occupancy = 1.0 if 9 <= t.hour < 18 else 0.1
                elif building_type == "lab":
                    occupancy = 1.0 if 8 <= t.hour < 20 else 0.3
                elif building_type == "hostel":
                    occupancy = 1.0 if (7 <= t.hour < 10) or (17 <= t.hour < 23) else 0.5
                demand_kw = self.demand_curve.demand_curve(t, peak_demand, occupancy, building_type)
                demand_forecast.timestamps.append(t.isoformat())
                demand_forecast.values.append(round(demand_kw, 2))

            forecast.demand[bid] = demand_forecast

        # Grid emission factor forecast (assumes constant for MVP)
        for i in range(total_steps):
            t = start_time + timedelta(minutes=i * self.forecast_interval_minutes)
            forecast.grid_emission.timestamps.append(t.isoformat())
            forecast.grid_emission.values.append(self.grid_emission_factor)

        logger.info(f"Forecast generated: {len(forecast.solar)} solar, {len(forecast.wind)} wind, {len(forecast.demand)} demand series")
        return forecast

    def _get_solar_capacity(self, bid: str, building_data: dict) -> float:
        """Extract or estimate solar capacity for a building."""
        # Use the current generation level as a proxy if capacity not stored
        current_gen = building_data.get("solar_generation_kwh", 0)
        # At peak irradiance (~1000 W/m²), gen_kwh = capacity_kw * 5/60 * 0.85
        # So capacity_kw = gen_kwh / (5/60 * 0.85) = gen_kwh * 12 / 0.85
        if current_gen > 0:
            return current_gen * 12.0 / 0.85
        return 100.0  # Default 100 kW

    def _get_wind_capacity(self, bid: str, building_data: dict) -> float:
        current_wind_gen = building_data.get("wind_generation_kwh", 0)
        if current_wind_gen > 0:
            return current_wind_gen * 12.0  # Approximate capacity from current output
        return 50.0

    def _estimate_peak_demand(self, bid: str, building_data: dict, solar_capacity: float) -> float:
        """Estimate peak demand based on building type and current consumption."""
        current_consumption = building_data.get("consumption_kwh", 0)
        current_kw = current_consumption * 12.0  # Convert to kW
        building_type = bid.split("_")[0] if "_" in bid else "academic"

        # Different buildings have different peak-to-average ratios
        peak_ratios = {"academic": 2.5, "hostel": 2.0, "lab": 1.5, "admin": 3.0, "sports": 2.0}
        ratio = peak_ratios.get(building_type, 2.0)
        estimated_peak = current_kw * ratio if current_kw > 0 else solar_capacity * 0.8

        # Clamp to realistic ranges per building type
        max_demands = {"academic": 150, "hostel": 80, "lab": 120, "admin": 50, "sports": 60}
        min_demands = {"academic": 60, "hostel": 40, "lab": 30, "admin": 10, "sports": 20}

        max_d = max_demands.get(building_type, 100)
        min_d = min_demands.get(building_type, 20)
        return max(min_d, min(max_d, estimated_peak))
