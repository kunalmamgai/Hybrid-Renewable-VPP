"""Adapter for REST/HTTP-enabled smart meters, inverters, and battery systems.

Polls REST endpoints at regular intervals and parses JSON responses into the VPP sensor schema.
Uses httpx for async HTTP requests compatible with FastAPI's async model.
"""
from __future__ import annotations
import logging
import time
from typing import Any
from dataclasses import dataclass

from backend.adapters.base import EnergyAdapter

logger = logging.getLogger(__name__)


@dataclass
class RestConfig:
    base_url: str
    api_key: str | None = None
    interval_seconds: float = 300.0
    timeout: float = 10.0


class RestAdapter(EnergyAdapter):
    """Reads sensor data from a REST API and writes control commands via POST.

    Endpoint convention:
      GET  {base_url}/sensors   → returns all sensor readings
      POST {base_url}/command   → accepts a control command
      GET  {base_url}/health    → returns health status
    """

    def __init__(self, config: RestConfig):
        self.config = config
        self._connected: bool = False
        self._last_read: float = 0.0
        self._telemetry: dict[str, Any] = {}

    @property
    def adapter_type(self) -> str:
        return "rest"

    async def _http_get(self, path: str) -> dict[str, Any]:
        import httpx
        headers = {}
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"
        async with httpx.AsyncClient(timeout=self.config.timeout) as client:
            resp = await client.get(f"{self.config.base_url}{path}", headers=headers)
            resp.raise_for_status()
            return resp.json()

    async def _http_post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        import httpx
        headers = {"Content-Type": "application/json"}
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"
        async with httpx.AsyncClient(timeout=self.config.timeout) as client:
            resp = await client.post(f"{self.config.base_url}{path}", json=payload, headers=headers)
            resp.raise_for_status()
            return resp.json()

    async def read_sensors(self) -> dict[str, Any]:
        start = time.time()
        try:
            self._telemetry = await self._http_get("/sensors")
            self._connected = True
        except Exception as e:
            logger.warning(f"REST read failed: {e}")
            self._connected = False
        self._last_read = time.time() - start
        return dict(self._telemetry)

    async def write_command(self, command: dict[str, Any]) -> bool:
        if not self._connected:
            return False
        try:
            await self._http_post("/command", command)
            logger.info(f"REST command sent: {command}")
            return True
        except Exception as e:
            logger.error(f"REST write failed: {e}")
            return False

    async def health(self) -> dict[str, Any]:
        try:
            health = await self._http_get("/health")
            status = "online" if health.get("status") == "online" else "offline"
        except Exception:
            status = "offline"
        return {
            "status": status,
            "latency_ms": round(self._last_read * 1000, 1),
            "adapter_type": self.adapter_type,
        }

    async def start_stream(self, interval_seconds: float = 300.0) -> None:
        logger.info(f"REST adapter polling started (interval={interval_seconds}s)")
        await self.read_sensors()

    async def stop_stream(self) -> None:
        logger.info("REST adapter stopped.")
