"""
RAILBLOCK AI — Realtime Event Manager (WebSocket)
"""
import asyncio
import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket
from app.schemas.events import RailBlockEvent, SimulationState

logger = logging.getLogger(__name__)

class EventManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, event: RailBlockEvent):
        """
        Broadcasts an event to all connected clients.
        """
        event.received_timestamp = event.timestamp # set processing time
        event_dict = event.model_dump(mode="json")
        message = json.dumps(event_dict)
        
        failed_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error sending message to websocket: {e}")
                failed_connections.append(connection)
                
        for connection in failed_connections:
            self.disconnect(connection)

# Global singleton
event_manager = EventManager()
