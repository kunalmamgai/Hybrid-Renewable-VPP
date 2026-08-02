"""Simulated adapter — generates realistic 5-minute sensor data for a full campus.

Implements the exact same EnergyAdapter interface as Modbus/MQTT/REST adapters,
but produces synthetic data instead of reading hardware. This is the enabler
for hackathon demos with ZERO real hardware — the same code path works with
a real Modbus/MQTT feed later by simply swapping the adapter class.

The simulator models:
  • Solar PV output driven by irradiance (cosine projection + cloud cover)
  • Wind turbine output driven by wind speed (piecewise power curve)
  • Battery SoC dynamics with charge/discharge losses
  • Building demand driven by time-of-day + occupancy
  • Grid import/export based on net balance
"""
from __future__ import annotations
import asyncio
import json
import logging
import math
from datetime import datetime, timezone, timedelta
from typing import Any
from dataclasses import dataclass, field

from backend.adapters.base import EnergyAdapter
from backend.simulator.solar_curve import SolarCurve
from backend.simulator.wind_curve import WindCurve
from backend.simulator.battery_model import BatteryModel
from backend.simulator.demand_curve import DemandCurve

logger = logging.getLogger(__name__)


@dataclass
class SimulatedConfig:
    time_scale: float = 60.0
    interval_seconds: float = 300.0
    scenario: str = "mvp_day"
    latitude: float = 26.9124  # Jaipur, Rajasthan
    longitude: float = 75.7873
    timezone: str = "Asia/Kolkata"


@dataclass
class SimulatedBuilding:
    building_id: str
    name: str
    criticality_tier: str = "non_critical"
    solar_capacity_kw: float = 100.0
    wind_capacity_kw: float = 50.0
    battery_capacity_kwh: float = 200.0
    battery_soc_initial_pct: float = 50.0
    tariff_inr_per_unit: float = 9.0
    vnm_sharing_ratio: float = 0.3


class SimulatedAdapter(EnergyAdapter):
    """Generates believable 5-minute readings for every source into the Digital Twin."""

    def __init__(self, config: SimulatedConfig, buildings: list[SimulatedBuilding]):
        self.config = config
        self.buildings = {b.building_id: b for b in buildings}

        # Sub-models
        self.solar = SolarCurve(config.latitude, config.longitude)
        self.wind = WindCurve(cut_in=3.5, rated=12.0, cut_out=25.0)
        self.battery_models: dict[str, BatteryModel] = {}
        self.demand = DemandCurve()

        # Scenario configuration
        self.scenarios = self._build_scenarios()

        # Simulation state
        self._sim_time: datetime | None = None
        self._sim_start: datetime | None = None
        self._running: bool = False
        self._last_readings: dict[str, Any] = {}
        self._read_count: int = 0

    @property
    def adapter_type(self) -> str:
        return "simulated"

    def _build_scenarios(self) -> dict[str, dict]:
        """Predefined weather + demand scenarios for demo playback."""
        return {
            "mvp_day": {
                "cloud_cover_base": 0.15,
                "cloud_cover_variability": 0.05,
                "wind_base": 5.5,
                "wind_gust_factor": 0.3,
                "demand_peak_kw": 180,
            },
            "cloudy_still_afternoon": {
                "cloud_cover_base": 0.8,
                "cloud_cover_variability": 0.1,
                "wind_base": 3.2,
                "wind_gust_factor": 0.1,
                "demand_peak_kw": 160,
            },
            "wind_fills_solar_gap": {
                "cloud_cover_base": 0.6,
                "cloud_cover_variability": 0.15,
                "wind_base": 8.0,
                "wind_gust_factor": 0.4,
                "demand_peak_kw": 150,
            },
            "shortfall_protects_hostel": {
                "cloud_cover_base": 0.9,
                "cloud_cover_variability": 0.05,
                "wind_base": 2.8,
                "wind_gust_factor": 0.05,
                "demand_peak_kw": 200,
            },
        }

    def _get_scenario_params(self, sim_time: datetime) -> dict:
        scenario = self.scenarios.get(self.config.scenario, self.scenarios["mvp_day"])
        hour = sim_time.hour
        # Time-of-day variation: wind often stronger at night, demand peaks at noon/6pm
        if 22 <= hour or hour < 6:
            wind_mult = 1.3
            demand_mult = 0.6
        elif 6 <= hour < 9:
            wind_mult = 1.0
            demand_mult = 0.8
        elif 9 <= hour < 17:
            wind_mult = 0.8
            demand_mult = 1.0
        elif 17 <= hour < 22:
            wind_mult = 0.9
            demand_mult = 1.2
        else:
            wind_mult = 1.0
            demand_mult = 1.0

        return {
            "cloud_cover_base": scenario["cloud_cover_base"],
            "cloud_cover_variability": scenario["cloud_cover_variability"],
            "wind_base": scenario["wind_base"] * wind_mult,
            "wind_gust_factor": scenario["wind_gust_factor"],
            "demand_peak_kw": scenario["demand_peak_kw"] * demand_mult,
        }

    def _advance_sim_time(self) -> tuple[datetime, int]:
        """Advance simulation time based on wall-clock time and time_scale.

        Uses absolute computation from _start_time to avoid accumulation errors.
        Each step = interval_seconds × time_scale of simulated time.

        Returns:
            (sim_time, step_index) where step_index is the 0-based index
            for this reading (used for deterministic variation in sensor data).
        """
        if self._sim_time is None:
            now = datetime.now(timezone(timedelta(hours=5, minutes=30)))
            self._sim_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
            self._sim_start = self._sim_time  # Store absolute start

        step_index = self._read_count
        sim_step_seconds = self.config.interval_seconds * self.config.time_scale
        self._sim_time = self._sim_start + timedelta(seconds=step_index * sim_step_seconds)
        self._read_count += 1
        return self._sim_time, step_index

    def _initialize_batteries(self) -> None:
        for bid, building in self.buildings.items():
            if bid not in self.battery_models:
                self.battery_models[bid] = BatteryModel(
                    capacity_kwh=building.battery_capacity_kwh,
                    initial_soc_pct=building.battery_soc_initial_pct,
                )

    async def read_sensors(self) -> dict[str, Any]:
        self._initialize_batteries()
        sim_time, step_index = self._advance_sim_time()
        params = self._get_scenario_params(sim_time)

        readings: dict[str, Any] = {"timestamp": sim_time.isoformat()}

        # Generate per-building data
        for bid, building in self.buildings.items():
            # Solar generation
            cloud_cover = max(0, min(1, params["cloud_cover_base"] +
                                     0.1 * math.sin(step_index / 10) +
                                     (params["cloud_cover_variability"] * 2 *
                                      ((step_index % 100) / 100.0 - 0.5))))
            irradiance = self.solar.irradiance(sim_time, cloud_cover)
            solar_kw = building.solar_capacity_kw * (irradiance / 1000.0) * 0.85  # 85% inverter eff

            # Wind generation
            wind_speed = max(0, params["wind_base"] +
                             params["wind_gust_factor"] *
                             math.sin(step_index / 7) +
                             0.5 * math.sin(step_index / 23))
            wind_kw = building.wind_capacity_kw * self.wind.power_output(wind_speed)

            # Demand — per-building peak proportional to building size (solar capacity proxy)
            occupancy = 0.3 if 18 <= sim_time.hour or sim_time.hour < 7 else 1.0
            building_type = building.building_id.split("_")[0]  # "academic", "hostel", etc.
            building_peak = params["demand_peak_kw"] * (building.solar_capacity_kw / 150.0)
            demand_kw = self.demand.demand_curve(sim_time, building_peak, occupancy, building_type)

            # Battery dynamics
            net_generation = solar_kw + wind_kw - demand_kw
            battery = self.battery_models[bid]
            
            # Check for commanded action
            cmd = getattr(self, "_commanded_actions", {}).get(bid)
            action = cmd["action"] if cmd else "auto"
            rate_kw = cmd["rate_kw"] if cmd else 0.0
            
            # Reset command after reading (so it only applies for one 5-min interval)
            if cmd:
                del self._commanded_actions[bid]

            grid_import = 0.0
            grid_export = 0.0

            if action == "auto":
                if net_generation > 0:
                    # Surplus → charge
                    charge_kw = min(net_generation * 0.95, battery.charge_rate_max_kw)
                    battery.charge(charge_kw, self.config.interval_seconds)
                    grid_export = max(0, net_generation - charge_kw) * 0.98
                else:
                    # Deficit → discharge
                    deficit = -net_generation
                    discharge_kw = min(deficit, battery.discharge_rate_max_kw, battery.available_power_kw())
                    actual_discharge = battery.discharge(discharge_kw, self.config.interval_seconds)
                    grid_import = max(0, deficit - actual_discharge)
            elif action in ("charge_rapid", "charge_slow", "charge"):
                # Force charge from renewables first, then grid if needed
                charge_target = rate_kw if rate_kw > 0 else (battery.charge_rate_max_kw if action == "charge_rapid" else 10.0)
                actual_charge = battery.charge(charge_target, self.config.interval_seconds)
                
                # Use renewables first
                if net_generation > 0:
                    from_renewables = min(net_generation, actual_charge)
                    from_grid = max(0, actual_charge - from_renewables)
                    grid_export = (net_generation - from_renewables) * 0.98
                else:
                    from_grid = actual_charge
                    grid_import = abs(net_generation) + from_grid
                
                grid_import += from_grid
            elif action == "discharge":
                # Force discharge to cover load or export
                discharge_target = rate_kw if rate_kw > 0 else battery.discharge_rate_max_kw
                actual_discharge = battery.discharge(discharge_target, self.config.interval_seconds)
                
                net_balance = net_generation + actual_discharge
                if net_balance > 0:
                    grid_export = net_balance * 0.98
                else:
                    grid_import = abs(net_balance)
            elif action in ("hold", "reserve"):
                # Maintain SoC, only use renewables for load, export surplus
                if net_generation > 0:
                    grid_export = net_generation * 0.98
                else:
                    grid_import = abs(net_generation)
            else:
                # Fallback to auto
                if net_generation > 0:
                    battery.charge(min(net_generation * 0.95, battery.charge_rate_max_kw), self.config.interval_seconds)
                else:
                    battery.discharge(min(-net_generation, battery.discharge_rate_max_kw, battery.available_power_kw()), self.config.interval_seconds)

            # Build the building twin reading
            readings[bid] = {
                "building_id": bid,
                "name": building.name,
                "criticality_tier": building.criticality_tier,
                "solar_generation_kwh": round(solar_kw * (self.config.interval_seconds / 3600), 2),
                "wind_generation_kwh": round(wind_kw * (self.config.interval_seconds / 3600), 2),
                "consumption_kwh": round(demand_kw * (self.config.interval_seconds / 3600), 2),
                "battery_soc_pct": round(battery.soc_pct, 1),
                "battery_health_pct": round(battery.health_pct, 1),
                "grid_import_kwh": round(grid_import * (self.config.interval_seconds / 3600), 2),
                "grid_export_kwh": round(grid_export * (self.config.interval_seconds / 3600), 2),
                "net_meter_units": round(grid_export * (self.config.interval_seconds / 3600) -
                                         grid_import * (self.config.interval_seconds / 3600), 2),
                "tariff_inr_per_unit": building.tariff_inr_per_unit,
                "vnm_sharing_ratio": building.vnm_sharing_ratio,
            }

            # Battery twin reading
            readings[f"battery_{bid}"] = {
                "battery_id": f"battery_{bid}",
                "building_id": bid,
                "soc_pct": round(battery.soc_pct, 1),
                "health_pct": round(battery.health_pct, 1),
                "capacity_kwh": battery.capacity_kwh,
                "temperature_c": round(25.0 + 5.0 * math.sin(step_index / 50), 1),
                "power_kw": round(battery.power_kw, 2),
            }

            # Turbine twin reading
            readings[f"turbine_{bid}"] = {
                "turbine_id": f"turbine_{bid}",
                "building_id": bid,
                "wind_speed_mps": round(wind_speed, 2),
                "wind_direction_deg": round(180 + 90 * math.sin(step_index / 30), 1),
                "power_output_kw": round(wind_kw, 2),
                "cut_in_speed_mps": self.wind.cut_in,
                "rated_speed_mps": self.wind.rated,
                "cut_out_speed_mps": self.wind.cut_out,
                "rated_power_kw": building.wind_capacity_kw,
                "status": "generating" if wind_kw > 0 else "idle",
            }

        self._last_readings = readings
        return readings

    async def write_command(self, command: dict[str, Any]) -> bool:
        """Accept commands for the simulator (used by the decision loop)."""
        target = command.get("target", "")
        action = command.get("action", "")
        logger.info(f"[SIM] Command: target={target}, action={action}, params={command}")

        if "battery" in target:
            bid = target.replace("battery_", "")
            if bid in self.battery_models:
                # Store the commanded action to be applied in the next read_sensors cycle
                if not hasattr(self, "_commanded_actions"):
                    self._commanded_actions = {}
                self._commanded_actions[bid] = {
                    "action": action,
                    "rate_kw": command.get("rate_kw", 0.0),
                    "timestamp": datetime.now(timezone.utc)
                }
        return True

    async def health(self) -> dict[str, Any]:
        return {
            "status": "online",
            "latency_ms": 0.1,
            "adapter_type": self.adapter_type,
            "sim_time": self._sim_time.isoformat() if self._sim_time else None,
            "read_count": self._read_count,
        }

    async def start_stream(self, interval_seconds: float = 300.0) -> None:
        """Start streaming readings at the given interval (non-blocking)."""
        self._running = True
        logger.info(f"SimulatedAdapter streaming started (interval={interval_seconds}s, scale={self.config.time_scale})")

    async def stop_stream(self) -> None:
        self._running = False
        logger.info("SimulatedAdapter stopped.")
