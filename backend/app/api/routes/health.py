"""
Health Check API Route

Provides a health check endpoint for monitoring the application status.
Useful for deployment platforms like Railway to verify the app is running.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    timestamp: str
    twitch_connected: bool
    channels_count: int
    channels: List[str]
    buffer_stats: dict
    websocket_clients: int


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.

    Returns the current status of all services:
    - Twitch IRC connection status
    - Number of channels being monitored
    - Message buffer statistics
    - WebSocket client count

    This is used by deployment platforms to verify the app is healthy.
    """
    from ...main import get_message_buffer, get_twitch_client
    from ..websockets.metrics_ws import manager

    buffer = get_message_buffer()
    client = get_twitch_client()

    # Check Twitch connection
    twitch_connected = False
    channels = []
    if client:
        twitch_connected = client.is_ready
        channels = list(client.connected_channels)

    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc).isoformat(),
        twitch_connected=twitch_connected,
        channels_count=len(channels),
        channels=channels,
        buffer_stats=buffer.get_stats(),
        websocket_clients=manager.client_count
    )
