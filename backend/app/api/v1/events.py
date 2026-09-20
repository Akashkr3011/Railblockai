"""
RAILBLOCK AI — Events API
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, BackgroundTasks, Depends
from app.core.dependencies import require_admin
from app.services.events_manager import event_manager
from app.schemas.events import RailBlockEvent
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await event_manager.connect(websocket)
    try:
        while True:
            # We don't expect much incoming data, but we must listen to detect disconnects
            data = await websocket.receive_text()
            logger.debug(f"Received from WS client: {data}")
    except WebSocketDisconnect:
        event_manager.disconnect(websocket)

@router.post("/publish", summary="Internal endpoint to publish an event to all connected clients", status_code=202)
async def publish_event(event: RailBlockEvent, background_tasks: BackgroundTasks, current_user = Depends(require_admin)):
    """
    Publish a realtime event. In production, this would be hooked to message brokers or DB triggers.
    For this prototype, other services POST here or call event_manager directly.
    """
    background_tasks.add_task(event_manager.broadcast, event)
    return {"status": "accepted"}
