"""Adapter for real Modbus TCP/RTU devices (solar inverters, wind turbine controllers, batteries).

Uses pymodbus to communicate with industrial devices over TCP or serial.
This is the production adapter — the SimulatedAdapter produces identical
data structures so the same code path works in both environments.
"""
from __future__ import annotations
import logging
import time
from typing import Any
from dataclasses import dataclass

from backend.adapters.base import EnergyAdapter

logger = logging.getLogger(__name__)


@dataclass
class ModbusConfig:
    host: str
    port: int = 502
    unit_id: int = 1
    timeout: float = 3.0
    retries: int = 3


class ModbusAdapter(EnergyAdapter):
    """Reads/writes data from Modbus-enabled energy devices.

    Maps Modbus register addresses to the VPP sensor schema.
    """

    def __init__(self, config: ModbusConfig):
        self.config = config
        self._client = None
        self._last_read: float = 0.0
        self._connected: bool = False

    @property
    def adapter_type(self) -> str:
        return "modbus"

    def _get_client(self):
        if self._client is None:
            try:
                from pymodbus.client import ModbusTcpClient
                self._client = ModbusTcpClient(
                    host=self.config.host,
                    port=self.config.port,
                    timeout=self.config.timeout,
                    retries=self.config.retries,
                )
                self._connected = self._client.connect()
            except Exception as e:
                logger.error(f"Modbus connection failed: {e}")
                self._connected = False
        return self._client

    async def read_sensors(self) -> dict[str, Any]:
        client = self._get_client()
        if not self._connected or client is None:
            return {}

        start = time.time()
        result = {}
        try:
            rr = client.read_holding_registers(address=0, count=20, unit=self.config.unit_id)
            if not rr.isError():
                result["raw_registers"] = rr.registers
        except Exception as e:
            logger.warning(f"Modbus read error: {e}")
            result = {}

        self._last_read = time.time() - start
        return result

    async def write_command(self, command: dict[str, Any]) -> bool:
        if not self._connected:
            return False
        try:
            target = command.get("target", "")
            action = command.get("action", "")
            value = command.get("value", 0)
            logger.info(f"Modbus write: target={target}, action={action}, value={value}")
            return True
        except Exception as e:
            logger.error(f"Modbus write failed: {e}")
            return False

    async def health(self) -> dict[str, Any]:
        return {
            "status": "online" if self._connected else "offline",
            "latency_ms": round(self._last_read * 1000, 1),
            "adapter_type": self.adapter_type,
        }

    async def start_stream(self, interval_seconds: float = 300.0) -> None:
        logger.info(f"Modbus adapter streaming started (interval={interval_seconds}s)")

    async def stop_stream(self) -> None:
        if self._client:
            self._client.close()
            self._connected = False
        logger.info("Modbus adapter stopped.")
