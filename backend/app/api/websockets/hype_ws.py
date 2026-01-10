"""
Hype Events WebSocket

Real-time push notifications for hype events.
Clients connect here to receive instant alerts when spikes are detected.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set
import json
import logging

from ...services.hype_detector import HypeEvent

logger = logging.getLogger(__name__)
router = APIRouter()


class HypeConnectionManager:
    """Manages WebSocket connections for hype alerts."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        """Accept and track a new connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Hype WebSocket client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a disconnected client."""
        self.active_connections.discard(websocket)
        logger.info(f"Hype WebSocket client disconnected. Total: {len(self.active_connections)}")

    async def broadcast_hype(self, event: HypeEvent):
        """
        Broadcast a hype event to all connected clients.

        Args:
            event: The detected hype event
        """
        if not self.active_connections:
            return

        message = json.dumps({
            "type": "hype_event",
            "channel": event.channel,
            "timestamp": event.timestamp.isoformat() + "Z",
            "velocity": event.velocity,
            "baseline_mean": event.baseline_mean,
            "baseline_std": event.baseline_std,
            "multiplier": event.multiplier,
            "top_emotes": event.top_emotes,
        })

        # Send to all connected clients
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send hype alert: {e}")
                disconnected.add(connection)

        # Remove disconnected clients
        self.active_connections -= disconnected


# Global manager instance
hype_manager = HypeConnectionManager()


@router.websocket("/ws/hype")
async def hype_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for hype event notifications.

    Clients connect here and receive JSON messages when hype is detected.
    """
    await hype_manager.connect(websocket)

    try:
        while True:
            # Keep connection alive, handle pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        hype_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Hype WebSocket error: {e}")
        hype_manager.disconnect(websocket)
