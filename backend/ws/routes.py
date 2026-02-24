from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ws.manager import ws_manager

router = APIRouter(prefix="/ws", tags=["websockets"])


@router.websocket("/webhook-events")
async def webhook_events_ws(websocket: WebSocket) -> None:
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive()
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception:
        await ws_manager.disconnect(websocket)
