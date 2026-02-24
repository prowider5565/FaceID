import asyncio
from typing import Any

from fastapi import WebSocket


class WebhookBroadcastManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)

    async def connection_count(self) -> int:
        async with self._lock:
            return len(self._connections)

    async def broadcast_json(self, payload: Any) -> None:
        async with self._lock:
            sockets = list(self._connections)

        dead_sockets: list[WebSocket] = []
        for socket in sockets:
            try:
                await socket.send_json(payload)
            except Exception:
                dead_sockets.append(socket)

        if dead_sockets:
            async with self._lock:
                for socket in dead_sockets:
                    self._connections.discard(socket)


ws_manager = WebhookBroadcastManager()
