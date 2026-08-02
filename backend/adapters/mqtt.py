"""Adapter for MQTT-based IoT devices (smart meters, wind sensors, battery monitors).

Subscribes to MQTT topics and maps incoming telemetry to the VPP sensor schema.
Uses paho-mqtt for asynchronous message handling.
"""
from __future__ import annotations
import json
import logging
import time
from typing import Any
from dataclasses import dataclass

from backend.adapters.base import EnergyAdapter

logger = logging.getLogger(__name__)


@dataclass
class MqttConfig:
    host: str
    port: int = 1883
    topics: list[str] | None = None
    username: str | None = None
    password: str | None = None
    keepalive: int = 60


class MqttAdapter(EnergyAdapter):
    """Reads sensor data from an MQTT broker and writes control commands to MQTT topics.

    Topic convention:
      read:  vpp/{device_id}/telemetry
      write: vpp/{device_id}/command
    """

    def __init__(self, config: MqttConfig):
        self.config = config
        self._client = None
        self._connected: bool = False
        self._telemetry: dict[str, Any] = {}
        self._last_read: float = 0.0

    @property
    def adapter_type(self) -> str:
        return "mqtt"

    def _get_client(self):
        if self._client is None:
            try:
                import paho.mqtt.client as mqtt

                self._client = mqtt.Client()
                if self.config.username:
                    self._client.username_pw_set(self.config.username, self.config.password)
                self._client.on_connect = self._on_connect
                self._client.on_message = self._on_message
                self._client.connect(self.config.host, self.config.port, self.config.keepalive)
                self._client.loop_start()
                self._connected = True
            except Exception as e:
                logger.error(f"MQTT connection failed: {e}")
                self._connected = False
        return self._client

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("MQTT connected successfully.")
            for topic in (self.config.topics or []):
                client.subscribe(topic)
        else:
            logger.error(f"MQTT connection failed with code {rc}.")

    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
            device_id = msg.topic.rstrip("/").split("/")[-2] if "/" in msg.topic else "unknown"
            self._telemetry[device_id] = payload
            self._last_read = time.time()
        except Exception as e:
            logger.warning(f"MQTT message parse error: {e}")

    async def read_sensors(self) -> dict[str, Any]:
        return dict(self._telemetry)

    async def write_command(self, command: dict[str, Any]) -> bool:
        if not self._connected or self._client is None:
            return False
        target = command.get("target", "")
        action = command.get("action", "")
        topic = f"vpp/{target}/command"
        payload = json.dumps({"action": action, **command})
        result = self._client.publish(topic, payload)
        return result[0] == 0

    async def health(self) -> dict[str, Any]:
        latency = (time.time() - self._last_read) if self._last_read else 0
        return {
            "status": "online" if self._connected else "offline",
            "latency_ms": round(latency * 1000, 1),
            "adapter_type": self.adapter_type,
        }

    async def start_stream(self, interval_seconds: float = 300.0) -> None:
        self._get_client()
        logger.info(f"MQTT adapter streaming started (topics={self.config.topics})")

    async def stop_stream(self) -> None:
        if self._client:
            self._client.loop_stop()
            self._client.disconnect()
            self._connected = False
        logger.info("MQTT adapter stopped.")
