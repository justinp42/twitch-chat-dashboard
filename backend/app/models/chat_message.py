"""
ChatMessage Data Model

This module defines the structure of a Twitch chat message.
Using Pydantic ensures type safety and automatic validation.

What is a Pydantic Model?
------------------------
Pydantic models are Python classes that:
1. Define the shape of your data using type hints
2. Automatically validate data when creating instances
3. Convert data types (e.g., string timestamps to datetime)
4. Serialize to/from JSON, dict, and other formats

Why use Pydantic instead of plain dictionaries?
----------------------------------------------
- Type safety: IDE autocomplete and error detection
- Validation: Invalid data raises clear errors immediately
- Documentation: The model IS the documentation
- Serialization: Easy conversion to JSON for APIs
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List
import uuid


class ChatMessage(BaseModel):
    """
    Represents a single Twitch chat message.

    This model captures all relevant information about a chat message
    that we need for analytics and metrics calculation.

    Attributes:
        id: Unique identifier for this message
        channel: The Twitch channel name (without the # prefix)
        username: The display name of the user who sent the message
        content: The actual text content of the message
        timestamp: When the message was sent (UTC)
        emotes: List of emote codes used in the message
        badges: List of badges the user has (subscriber, moderator, etc.)

    Example:
        >>> msg = ChatMessage(
        ...     id="abc123",
        ...     channel="jasontheween",
        ...     username="CoolViewer",
        ...     content="KEKW that was hilarious!",
        ...     timestamp=datetime.utcnow(),
        ...     emotes=["KEKW"],
        ...     badges=["subscriber"]
        ... )
        >>> msg.model_dump_json()  # Convert to JSON string
    """

    # Unique message identifier
    # Field(...) means this field is required
    # default_factory generates a new UUID if not provided
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique identifier for the message"
    )

    # Channel name (e.g., "jasontheween", not "#jasontheween")
    channel: str = Field(
        ...,  # ... means required, no default
        description="Twitch channel name without the # prefix"
    )

    # The username/display name of the sender
    username: str = Field(
        ...,
        description="Display name of the message sender"
    )

    # The actual message content
    content: str = Field(
        ...,
        description="The text content of the message"
    )

    # When the message was sent
    # default_factory=datetime.utcnow means if not provided, use current time
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="UTC timestamp when the message was sent"
    )

    # List of emote codes found in the message
    # Examples: ["LUL", "KEKW", "PogChamp"]
    emotes: List[str] = Field(
        default_factory=list,
        description="List of emote codes used in the message"
    )

    # List of badges the user has
    # Examples: ["subscriber", "moderator", "vip", "broadcaster"]
    badges: List[str] = Field(
        default_factory=list,
        description="List of badges the user has"
    )

    class Config:
        """Pydantic model configuration."""
        # Allow creating model from ORM objects (useful with SQLAlchemy)
        from_attributes = True

        # Example for documentation
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "channel": "jasontheween",
                "username": "CoolViewer123",
                "content": "KEKW that play was insane!",
                "timestamp": "2026-01-15T20:30:00Z",
                "emotes": ["KEKW"],
                "badges": ["subscriber", "vip"]
            }
        }


class ChannelMetrics(BaseModel):
    """
    Aggregated metrics for a Twitch channel.

    These metrics are calculated from the message buffer and sent
    to the frontend via WebSocket every second.

    Attributes:
        channel: The channel these metrics are for
        timestamp: When these metrics were calculated
        messages_per_second: Current chat velocity
        messages_last_minute: Total messages in the last 60 seconds
        unique_chatters_5min: Unique users who chatted in last 5 minutes
        top_emotes: Most used emotes with their counts
        avg_message_length: Average characters per message
    """

    channel: str = Field(
        ...,
        description="Channel name these metrics are for"
    )

    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="When these metrics were calculated"
    )

    messages_per_second: float = Field(
        default=0.0,
        description="Messages per second (current velocity)"
    )

    messages_last_minute: int = Field(
        default=0,
        description="Total messages in the last 60 seconds"
    )

    unique_chatters_5min: int = Field(
        default=0,
        description="Unique users who sent messages in last 5 minutes"
    )

    # List of tuples: [("LUL", 234), ("KEKW", 189)]
    top_emotes: List[tuple] = Field(
        default_factory=list,
        description="Top emotes with counts: [(emote, count), ...]"
    )

    avg_message_length: float = Field(
        default=0.0,
        description="Average message length in characters"
    )

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "channel": "jasontheween",
                "timestamp": "2026-01-15T20:30:00Z",
                "messages_per_second": 47.3,
                "messages_last_minute": 2340,
                "unique_chatters_5min": 892,
                "top_emotes": [["LUL", 234], ["KEKW", 189]],
                "avg_message_length": 18.5
            }
        }
