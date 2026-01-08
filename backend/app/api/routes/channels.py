"""
Channel Management API Routes

These endpoints allow managing which Twitch channels are being monitored.

Endpoints:
- GET /api/channels - List all monitored channels
- POST /api/channels - Add a new channel to monitor
- DELETE /api/channels/{name} - Stop monitoring a channel
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()


class ChannelRequest(BaseModel):
    """Request body for adding a channel."""
    channel: str


class ChannelResponse(BaseModel):
    """Response for channel operations."""
    status: str
    channel: str


@router.get("/channels", response_model=List[str])
async def list_channels():
    """
    List all currently monitored channels.

    Returns a list of channel names that are being monitored.
    These are channels we've joined and are receiving messages from.
    """
    # Import here to avoid circular imports
    from ...main import get_message_buffer, get_twitch_client

    buffer = get_message_buffer()
    client = get_twitch_client()

    # Get channels from the Twitch client (what we've joined)
    if client and client.connected_channels:
        return list(client.connected_channels)

    # Fallback to channels that have messages in buffer
    return buffer.get_all_channels()


@router.post("/channels", response_model=ChannelResponse)
async def add_channel(request: ChannelRequest):
    """
    Add a new channel to monitor.

    Joins the specified Twitch channel and starts receiving messages.
    Channel name should be lowercase, without the # prefix.

    Args:
        request: Contains the channel name to add

    Returns:
        Status and channel name
    """
    from ...main import get_twitch_client

    channel = request.channel.lower().strip()

    if not channel:
        raise HTTPException(status_code=400, detail="Channel name cannot be empty")

    client = get_twitch_client()

    if not client:
        raise HTTPException(
            status_code=503,
            detail="Twitch client not connected. Check credentials."
        )

    # Check if already monitoring this channel
    if channel in client.connected_channels:
        return ChannelResponse(status="already_joined", channel=channel)

    # Join the channel
    try:
        await client.join_channel(channel)
        return ChannelResponse(status="joined", channel=channel)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to join channel: {str(e)}")


@router.delete("/channels/{name}", response_model=ChannelResponse)
async def remove_channel(name: str):
    """
    Stop monitoring a channel.

    Leaves the specified Twitch channel and stops receiving messages.
    Messages already in the buffer are not deleted.

    Args:
        name: The channel name to stop monitoring

    Returns:
        Status and channel name
    """
    from ...main import get_twitch_client

    channel = name.lower().strip()

    client = get_twitch_client()

    if not client:
        raise HTTPException(
            status_code=503,
            detail="Twitch client not connected"
        )

    # Check if we're monitoring this channel
    if channel not in client.connected_channels:
        raise HTTPException(
            status_code=404,
            detail=f"Not monitoring channel: {channel}"
        )

    # Leave the channel
    try:
        await client.leave_channel(channel)
        return ChannelResponse(status="left", channel=channel)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to leave channel: {str(e)}")
