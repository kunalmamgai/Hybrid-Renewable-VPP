"""WebSocket manager for real-time push to frontend."""
import asyncio
import json
import logging
from typing import Any
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and broadcasts messages to connected clients."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self._connected = asyncio.Event()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        if len(self.active_connections) == 1:
            self._connected.set()
        logger.info(f"WebSocket client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if not self.active_connections:
            self._connected.clear()
        logger.info(f"WebSocket client disconnected. Total: {len(self.active_connections)}")

    async def send_to_all(self, message: dict[str, Any]) -> None:
        """Broadcast a message to all connected clients."""
        if not self.active_connections:
            return
        payload = json.dumps(jsonable_encoder(message))
        dead = []
        for ws in self.active_connections:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    async def send_to_one(self, websocket: WebSocket, message: dict[str, Any]) -> None:
        try:
            await websocket.send_json(jsonable_encoder(message))
        except WebSocketDisconnect:
            self.disconnect(websocket)

    async def wait_for_client(self, timeout: float = 30.0) -> bool:
        """Wait until at least one client connects (for demo readiness)."""
        try:
            await asyncio.wait_for(self._connected.wait(), timeout=timeout)
            return True
        except asyncio.TimeoutError:
            return False

    @property
    def client_count(self) -> int:
        return len(self.active_connections)
