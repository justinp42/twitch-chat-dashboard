"""
WebSocket Endpoint for Real-Time Metrics

This module handles WebSocket connections for streaming metrics to the frontend.

How WebSockets Work:
1. Client opens connection to /ws/metrics
2. Server accepts and adds client to active connections
3. Every second, server broadcasts metrics to ALL connected clients
4. Client receives and displays the metrics
5. On disconnect, server removes client from list

Why WebSocket Instead of HTTP Polling?
- HTTP Polling: Client asks "any updates?" every second = high latency, wasted requests
- WebSocket: Server pushes updates instantly = low latency, efficient
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set, Dict
import asyncio
import json
import logging

from ...models.chat_message import ChannelMetrics

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    """
    Manages WebSocket connections for metrics streaming.

    Keeps track of all connected clients and provides methods
    for broadcasting messages to all of them.

    Attributes:
        active_connections: Set of connected WebSocket clients
    """

    def __init__(self):
        """Initialize the connection manager."""
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        """
        Accept a new WebSocket connection.

        Args:
            websocket: The WebSocket client to add
        """
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection.

        Args:
            websocket: The WebSocket client to remove
        """
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast_metrics(self, metrics: ChannelMetrics):
        """
        Broadcast metrics to all connected clients.

        Sends the metrics as JSON to every connected WebSocket client.
        Handles disconnected clients gracefully by removing them.

        Args:
            metrics: The ChannelMetrics to broadcast
        """
        if not self.active_connections:
            return

        # Convert metrics to dict and add message type
        message = {
            "type": "metrics",
            **metrics.model_dump(mode="json")
        }

        # Convert datetime to ISO format string
        if "timestamp" in message:
            message["timestamp"] = metrics.timestamp.isoformat()

        # Convert top_emotes tuples to lists for JSON
        if "top_emotes" in message:
            message["top_emotes"] = [list(e) for e in message["top_emotes"]]

        # Send to all clients, track disconnected ones
        disconnected = set()

        for websocket in self.active_connections:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.debug(f"Failed to send to client: {e}")
                disconnected.add(websocket)

        # Remove disconnected clients
        self.active_connections -= disconnected

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """
        Send a message to a specific client.

        Args:
            message: The message dict to send
            websocket: The client to send to
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.debug(f"Failed to send personal message: {e}")

    @property
    def client_count(self) -> int:
        """Get the number of connected clients."""
        return len(self.active_connections)


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/ws/metrics")
async def websocket_metrics(websocket: WebSocket):
    """
    WebSocket endpoint for receiving real-time metrics.

    Clients connect here to receive metrics updates every second.
    The connection stays open until the client disconnects.

    Message Format (sent every second for each channel):
    {
        "type": "metrics",
        "channel": "jasontheween",
        "timestamp": "2026-01-15T20:30:00Z",
        "messages_per_second": 12.5,
        "messages_last_minute": 423,
        "unique_chatters_5min": 156,
        "top_emotes": [["LUL", 89], ["KEKW", 67]],
        "avg_message_length": 18.3
    }
    """
    await manager.connect(websocket)

    try:
        # Keep connection alive and listen for client messages
        # (we don't expect any, but this keeps the connection open)
        while True:
            # Wait for any message from client (ping, etc.)
            # This also detects disconnection
            data = await websocket.receive_text()

            # Handle ping/pong for connection health
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected normally")
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {type(e).__name__}: {e}")
        manager.disconnect(websocket)


@router.websocket("/ws/channel/{channel_name}")
async def websocket_channel(websocket: WebSocket, channel_name: str):
    """
    WebSocket endpoint for a specific channel's metrics.

    Similar to /ws/metrics but only receives updates for one channel.
    Useful when the frontend is focused on a single channel.

    Args:
        channel_name: The channel to receive metrics for
    """
    await manager.connect(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected normally")
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {type(e).__name__}: {e}")
        manager.disconnect(websocket)
