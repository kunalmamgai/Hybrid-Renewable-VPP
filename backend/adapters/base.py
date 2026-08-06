"""Abstract Base Class for the vendor-neutral adapter layer.

All hardware adapters (Modbus, MQTT, REST, OPC-UA) and the SimulatedAdapter
must implement this interface. This is what makes the system truly vendor-neutral:
the core code never talks to hardware directly — it goes through this contract.
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)


class EnergyAdapter(ABC):
    """Abstract interface that every hardware adapter must implement.

    The adapter is the single point of contact between physical/simulated
    hardware and the rest of the VPP platform. New vendors simply implement
    this interface — no core code changes required.
    """

    @property
    @abstractmethod
    def adapter_type(self) -> str:
        """Human-readable identifier for this adapter type."""
        ...

    @abstractmethod
    async def read_sensors(self) -> dict[str, Any]:
        """Read all sensors available through this adapter.

        Returns:
            A dictionary mapping sensor paths to values. Structure:
            {
                "building_id": {
                    "solar_generation_kwh": float,
                    "wind_generation_kwh": float,
                    "consumption_kwh": float,
                    "grid_import_kwh": float,
                    "grid_export_kwh": float,
                    "net_meter_units": float,
                },
                "turbine_id": {
                    "wind_speed_mps": float,
                    "wind_direction_deg": float,
                    "power_output_kw": float,
                },
                "battery_id": {
                    "soc_pct": float,
                    "health_pct": float,
                    "capacity_kwh": float,
                    "temperature_c": float,
                    "power_kw": float,
                },
            }
        """
        ...

    @abstractmethod
    async def write_command(self, command: dict[str, Any]) -> bool:
        """Send a control command to hardware (if supported).

        Args:
            command: A dictionary describing the desired action, e.g.:
                {"target": "battery_1", "action": "charge", "rate_kw": 50.0}
        Returns:
            True if the command was accepted, False otherwise.
        """
        ...

    @abstractmethod
    async def health(self) -> dict[str, Any]:
        """Check adapter connectivity and return health status.

        Returns:
            {"status": "online"|"offline"|"degraded", "latency_ms": float, "last_read": str}
        """
        ...

    @abstractmethod
    async def start_stream(self, interval_seconds: float = 300.0) -> None:
        """Begin streaming sensor data at the given interval.

        This method should start a background task that calls read_sensors()
        and publishes results to the Digital Twin. Implementations may use
        polling (Modbus/REST), subscription (MQTT), or generate internally
        (Simulated).
        """
        ...

    @abstractmethod
    async def stop_stream(self) -> None:
        """Stop the streaming background task."""
        ...
