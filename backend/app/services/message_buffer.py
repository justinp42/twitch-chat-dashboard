"""
Message Buffer Service

This module provides in-memory storage for recent chat messages using
Python's collections.deque (double-ended queue).

Why We Need a Buffer
--------------------
We need to calculate metrics like:
- Messages per second (need last 1 second of messages)
- Messages per minute (need last 60 seconds)
- Unique chatters in 5 minutes (need last 5 minutes)
- Top emotes (need recent messages to count)

Instead of querying a database for every metric calculation,
we keep recent messages in memory for fast access.

Why deque Instead of list?
--------------------------
Python's deque has several advantages:

1. Fixed Maximum Size:
   deque(maxlen=10000) automatically removes oldest items when full.
   With a list, you'd need to manually manage size:

   # With list (manual management):
   messages.append(new_msg)
   if len(messages) > 10000:
       messages.pop(0)  # O(n) operation!

   # With deque (automatic):
   messages.append(new_msg)  # Old items auto-removed, O(1)

2. O(1) Operations:
   - append (add to right): O(1)
   - appendleft (add to left): O(1)
   - pop (remove from right): O(1)
   - popleft (remove from left): O(1)

   List is O(n) for operations at the beginning.

3. Thread-Safety:
   In CPython, deque's append and pop operations are atomic,
   making it safer for concurrent access (though we use async).

Memory Considerations
--------------------
Each ChatMessage is approximately 500 bytes.
With 10,000 messages per channel and 3 channels:
  3 × 10,000 × 500 bytes ≈ 15 MB

This is very reasonable and keeps access instant.
"""

from collections import deque
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
import logging

from ..models.chat_message import ChatMessage

logger = logging.getLogger(__name__)


class MessageBuffer:
    """
    In-memory buffer for storing recent chat messages.

    Messages are stored per-channel in fixed-size deques.
    When a deque reaches its maximum size, oldest messages
    are automatically discarded.

    Thread Safety Note:
        While deque operations are atomic in CPython, this class
        is designed for use with asyncio (single-threaded concurrency).
        For true multi-threading, additional locking would be needed.

    Attributes:
        _buffers: Dict mapping channel names to message deques
        _maxlen: Maximum messages to store per channel

    Usage:
        buffer = MessageBuffer(maxlen=10000)

        # Add a message
        buffer.add_message("jasontheween", message)

        # Get messages from last 60 seconds
        recent = buffer.get_messages_since("jasontheween", datetime.utcnow() - timedelta(seconds=60))
    """

    def __init__(self, maxlen: int = 10000):
        """
        Initialize the message buffer.

        Args:
            maxlen: Maximum number of messages to store per channel.
                   When this limit is reached, oldest messages are
                   automatically removed. Default is 10,000 messages.
        """
        # Dictionary mapping channel name -> deque of messages
        # Using Dict[str, deque] instead of defaultdict for explicit control
        self._buffers: Dict[str, deque] = {}

        # Maximum messages per channel
        self._maxlen = maxlen

        logger.info(f"MessageBuffer initialized with maxlen={maxlen}")

    def add_message(self, channel: str, message: ChatMessage) -> None:
        """
        Add a message to the buffer for a specific channel.

        If the channel's buffer doesn't exist, it's created automatically.
        If the buffer is full, the oldest message is automatically removed.

        Args:
            channel: The channel name (without # prefix)
            message: The ChatMessage to store

        Example:
            >>> buffer.add_message("jasontheween", ChatMessage(
            ...     channel="jasontheween",
            ...     username="viewer1",
            ...     content="Hello!"
            ... ))
        """
        # Normalize channel name to lowercase
        channel = channel.lower()

        # Create buffer for this channel if it doesn't exist
        if channel not in self._buffers:
            self._buffers[channel] = deque(maxlen=self._maxlen)
            logger.debug(f"Created new buffer for channel: {channel}")

        # Add message to the channel's buffer
        # If buffer is full, oldest message is automatically removed
        self._buffers[channel].append(message)

    def get_messages_since(
        self,
        channel: str,
        since: datetime,
        limit: Optional[int] = None
    ) -> List[ChatMessage]:
        """
        Get all messages from a channel since a given timestamp.

        This is the primary method for metrics calculation.
        For example, to calculate messages in the last minute:

            one_minute_ago = datetime.utcnow() - timedelta(minutes=1)
            recent_messages = buffer.get_messages_since("channel", one_minute_ago)

        Args:
            channel: The channel name to query
            since: Only return messages after this timestamp
            limit: Optional maximum number of messages to return

        Returns:
            List of ChatMessage objects, ordered oldest to newest

        Note:
            This performs a linear scan O(n) of the deque.
            For our use case (10k messages max), this is fast enough.
            For larger scales, consider a time-indexed structure.
        """
        channel = channel.lower()

        if channel not in self._buffers:
            return []

        # Ensure 'since' has timezone info for comparison
        if since.tzinfo is None:
            since = since.replace(tzinfo=timezone.utc)

        # Filter messages by timestamp
        # We iterate from newest to oldest for efficiency when using limit
        messages = []
        for message in reversed(self._buffers[channel]):
            # Ensure message timestamp has timezone info
            msg_time = message.timestamp
            if msg_time.tzinfo is None:
                msg_time = msg_time.replace(tzinfo=timezone.utc)

            if msg_time >= since:
                messages.append(message)
                if limit and len(messages) >= limit:
                    break
            else:
                # Since deque is ordered by time, we can stop early
                # (older messages are at the front)
                # But we're iterating in reverse, so continue
                pass

        # Return in chronological order (oldest first)
        return list(reversed(messages))

    def get_recent_messages(
        self,
        channel: str,
        count: int = 50
    ) -> List[ChatMessage]:
        """
        Get the N most recent messages from a channel.

        Useful for displaying a chat feed on the frontend.

        Args:
            channel: The channel name to query
            count: Number of recent messages to return (default 50)

        Returns:
            List of ChatMessage objects, ordered oldest to newest
        """
        channel = channel.lower()

        if channel not in self._buffers:
            return []

        # Get the last N messages
        # deque supports negative indexing like lists
        buffer = self._buffers[channel]
        start_idx = max(0, len(buffer) - count)

        return list(buffer)[start_idx:]

    def get_all_channels(self) -> List[str]:
        """
        Get a list of all channels with message buffers.

        Returns:
            List of channel names that have received messages
        """
        return list(self._buffers.keys())

    def get_message_count(self, channel: str) -> int:
        """
        Get the number of messages currently buffered for a channel.

        Args:
            channel: The channel name to query

        Returns:
            Number of messages in the buffer (0 if channel not found)
        """
        channel = channel.lower()
        if channel not in self._buffers:
            return 0
        return len(self._buffers[channel])

    def clear_channel(self, channel: str) -> None:
        """
        Clear all messages for a specific channel.

        Useful when a channel is removed from monitoring.

        Args:
            channel: The channel name to clear
        """
        channel = channel.lower()
        if channel in self._buffers:
            self._buffers[channel].clear()
            logger.info(f"Cleared buffer for channel: {channel}")

    def clear_all(self) -> None:
        """
        Clear all message buffers for all channels.

        Use with caution - this removes all stored messages.
        """
        self._buffers.clear()
        logger.info("Cleared all message buffers")

    def get_stats(self) -> Dict:
        """
        Get statistics about the buffer state.

        Useful for debugging and monitoring.

        Returns:
            Dict with buffer statistics
        """
        return {
            "total_channels": len(self._buffers),
            "max_per_channel": self._maxlen,
            "channels": {
                channel: len(buffer)
                for channel, buffer in self._buffers.items()
            }
        }


# Create a global buffer instance for easy importing
# This is a singleton pattern - one buffer for the entire application
message_buffer = MessageBuffer()
