"""Digital Twin Store — manages persistence and updates of the campus Digital Twin.

This service sits between the adapter layer and the AI optimization engine.
It reads raw sensor data from the adapter, transforms it into the Digital Twin
schema, and persists it to SQLite. All other services query this store.

Design patterns:
  • CQRS: write model (update_twin) is separate from read model (get_building)
  • Unit of Work: each 5-min cycle is a single atomic twin update
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Optional
from sqlalchemy import select, insert, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.digital_twin import BuildingTwin, WindTurbineTwin, BatteryTwin
from backend.adapters.base import EnergyAdapter
from backend.adapters.simulated import SimulatedAdapter, SimulatedBuilding

logger = logging.getLogger(__name__)


class DigitalTwinStore:
    """Manages the Digital Twin lifecycle: ingest → transform → persist → serve."""

    def __init__(self, adapter: EnergyAdapter):
        self.adapter = adapter
        self._buildings: dict[str, dict] = {}
        self._turbines: dict[str, dict] = {}
        self._batteries: dict[str, dict] = {}
        self._last_update: Optional[datetime] = None

    async def update_twin(self, session: AsyncSession) -> dict[str, Any]:
        """Read sensors via adapter, update in-memory twin, persist to DB.

        Returns the complete twin snapshot for downstream modules.
        """
        return await self.update_twin_with_data(session, await self.adapter.read_sensors())

    async def update_twin_with_data(self, session: AsyncSession, raw: dict[str, Any]) -> dict[str, Any]:
        """Update the twin from pre-read sensor data, persist to DB.

        This avoids double-reading sensors when the scheduler already has the data.
        """
        timestamp = raw.pop("timestamp", datetime.now(timezone(timedelta(hours=5, minutes=30))).isoformat())

        # Update in-memory structures and persist
        for key, value in raw.items():
            if key in self.adapter.buildings:
                # Building twin update
                await self._update_building(session, key, value)
                self._buildings[key] = value
            elif key.startswith("turbine_"):
                bid = key.replace("turbine_", "")
                await self._upsert_turbine(session, value)
                self._turbines[key] = value
            elif key.startswith("battery_"):
                bid = key.replace("battery_", "")
                await self._upsert_battery(session, value)
                self._batteries[key] = value

        self._last_update = datetime.now(timezone.utc)
        await session.commit()

        # Return flat dict for compatibility with AI modules and Scheduler
        result = {**self._buildings, **self._turbines, **self._batteries}
        result["timestamp"] = timestamp
        return result

    async def _update_building(self, session: AsyncSession, bid: str, data: dict) -> None:
        """Update or insert a building twin record."""
        existing = await session.get(BuildingTwin, bid)
        if existing:
            for k, v in data.items():
                if hasattr(existing, k):
                    setattr(existing, k, v)
        else:
            building = BuildingTwin(
                id=bid,
                name=data.get("name", bid),
                criticality_tier=data.get("criticality_tier", "non_critical"),
                solar_generation_kwh=data.get("solar_generation_kwh", 0),
                wind_generation_kwh=data.get("wind_generation_kwh", 0),
                consumption_kwh=data.get("consumption_kwh", 0),
                battery_soc_pct=data.get("battery_soc_pct", 50),
                battery_health_pct=data.get("battery_health_pct", 96),
                grid_import_kwh=data.get("grid_import_kwh", 0),
                grid_export_kwh=data.get("grid_export_kwh", 0),
                net_meter_units=data.get("net_meter_units", 0),
                tariff_inr_per_unit=data.get("tariff_inr_per_unit", 9.0),
                predicted_solar_tomorrow_kwh=data.get("predicted_solar_tomorrow_kwh", 0),
                predicted_wind_tomorrow_kwh=data.get("predicted_wind_tomorrow_kwh", 0),
            )
            session.add(building)

    async def _upsert_turbine(self, session: AsyncSession, data: dict) -> None:
        tid = data.get("turbine_id", "unknown")
        existing = await session.get(WindTurbineTwin, tid)
        if existing:
            for k, v in data.items():
                if hasattr(existing, k):
                    setattr(existing, k, v)
        else:
            turbine = WindTurbineTwin(
                id=tid,
                building_id=data.get("building_id", ""),
                wind_speed_mps=data.get("wind_speed_mps", 0),
                wind_direction_deg=data.get("wind_direction_deg", 0),
                power_output_kw=data.get("power_output_kw", 0),
                cut_in_speed_mps=data.get("cut_in_speed_mps", 3.5),
                rated_speed_mps=data.get("rated_speed_mps", 12.0),
                cut_out_speed_mps=data.get("cut_out_speed_mps", 25.0),
                rated_power_kw=data.get("rated_power_kw", 100.0),
                status=data.get("status", "idle"),
            )
            session.add(turbine)

    async def _upsert_battery(self, session: AsyncSession, data: dict) -> None:
        bid = data.get("battery_id", "unknown")
        existing = await session.get(BatteryTwin, bid)
        if existing:
            for k, v in data.items():
                if hasattr(existing, k):
                    setattr(existing, k, v)
        else:
            battery = BatteryTwin(
                id=bid,
                building_id=data.get("building_id", ""),
                soc_pct=data.get("soc_pct", 50.0),
                health_pct=data.get("health_pct", 96.0),
                capacity_kwh=data.get("capacity_kwh", 200.0),
                charge_rate_max_kw=data.get("charge_rate_max_kw", 50.0),
                discharge_rate_max_kw=data.get("discharge_rate_max_kw", 50.0),
                temperature_c=data.get("temperature_c", 25.0),
                voltage_v=data.get("voltage_v", 48.0),
                current_a=data.get("current_a", 0.0),
                power_kw=data.get("power_kw", 0.0),
            )
            session.add(battery)

    async def get_twin_snapshot(self, session: AsyncSession) -> dict[str, Any]:
        """Return the full twin snapshot from the database."""
        buildings = (await session.execute(select(BuildingTwin))).scalars().all()
        turbines = (await session.execute(select(WindTurbineTwin))).scalars().all()
        batteries = (await session.execute(select(BatteryTwin))).scalars().all()
        return {
            "buildings": [b.to_dict() for b in buildings],
            "turbines": [t.to_dict() for t in turbines],
            "batteries": [b.to_dict() for b in batteries],
            "last_updated": self._last_update.isoformat() if self._last_update else None,
        }

    def get_building(self, building_id: str) -> Optional[dict]:
        """Get a building twin from the in-memory cache."""
        return self._buildings.get(building_id)
