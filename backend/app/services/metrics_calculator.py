"""
Metrics Calculator Service

This service calculates real-time metrics from the message buffer.
It's called every second to generate metrics for each channel.

Metrics Calculated:
- messages_per_second: Chat velocity in the last second
- messages_last_minute: Total messages in last 60 seconds
- unique_chatters_5min: Unique usernames in last 5 minutes
- top_emotes: Most used emotes with counts
- avg_message_length: Average characters per message
"""

from datetime import datetime, timedelta, timezone
from collections import Counter
from typing import List, Dict
import logging

from ..models.chat_message import ChatMessage, ChannelMetrics
from .message_buffer import MessageBuffer

logger = logging.getLogger(__name__)


class MetricsCalculator:
    """
    Calculates aggregated metrics from the message buffer.

    This class is stateless - it reads from the buffer each time
    calculate_metrics() is called. This means metrics are always
    calculated from fresh data.

    Usage:
        calculator = MetricsCalculator(message_buffer)
        metrics = calculator.calculate_metrics("jasontheween")
    """

    def __init__(self, buffer: MessageBuffer):
        """
        Initialize the metrics calculator.

        Args:
            buffer: The message buffer to read from
        """
        self.buffer = buffer

    def calculate_metrics(self, channel: str) -> ChannelMetrics:
        """
        Calculate all metrics for a channel.

        This is the main method called every second to generate
        metrics for WebSocket broadcast.

        Args:
            channel: The channel name to calculate metrics for

        Returns:
            ChannelMetrics object with all calculated values
        """
        now = datetime.now(timezone.utc)

        # Get messages for different time windows
        messages_1s = self._get_messages_in_window(channel, now, seconds=1)
        messages_1m = self._get_messages_in_window(channel, now, seconds=60)
        messages_5m = self._get_messages_in_window(channel, now, seconds=300)

        # Calculate each metric
        messages_per_second = len(messages_1s)
        messages_last_minute = len(messages_1m)
        unique_chatters = self._count_unique_chatters(messages_5m)
        top_emotes = self._get_top_emotes(messages_5m, limit=10)
        avg_length = self._calculate_avg_message_length(messages_5m)

        return ChannelMetrics(
            channel=channel,
            timestamp=now,
            messages_per_second=float(messages_per_second),
            messages_last_minute=messages_last_minute,
            unique_chatters_5min=unique_chatters,
            top_emotes=top_emotes,
            avg_message_length=avg_length
        )

    def _get_messages_in_window(
        self,
        channel: str,
        now: datetime,
        seconds: int
    ) -> List[ChatMessage]:
        """
        Get messages from the buffer within a time window.

        Args:
            channel: Channel to query
            now: Current timestamp
            seconds: How many seconds back to look

        Returns:
            List of messages within the window
        """
        since = now - timedelta(seconds=seconds)
        return self.buffer.get_messages_since(channel, since)

    def _count_unique_chatters(self, messages: List[ChatMessage]) -> int:
        """
        Count unique usernames in a list of messages.

        Args:
            messages: List of messages to analyze

        Returns:
            Number of unique usernames
        """
        usernames = set(msg.username.lower() for msg in messages)
        return len(usernames)

    def _get_top_emotes(
        self,
        messages: List[ChatMessage],
        limit: int = 10
    ) -> List[tuple]:
        """
        Get the most frequently used emotes.

        Args:
            messages: List of messages to analyze
            limit: How many top emotes to return

        Returns:
            List of (emote_name, count) tuples, sorted by count descending
        """
        # Flatten all emotes from all messages
        all_emotes = []
        for msg in messages:
            all_emotes.extend(msg.emotes)

        # Count occurrences
        emote_counts = Counter(all_emotes)

        # Return top N as list of tuples
        return emote_counts.most_common(limit)

    def _calculate_avg_message_length(self, messages: List[ChatMessage]) -> float:
        """
        Calculate average message length in characters.

        Args:
            messages: List of messages to analyze

        Returns:
            Average length, or 0.0 if no messages
        """
        if not messages:
            return 0.0

        total_length = sum(len(msg.content) for msg in messages)
        return round(total_length / len(messages), 1)

    def get_velocity_history(
        self,
        channel: str,
        window_seconds: int = 60
    ) -> List[Dict]:
        """
        Get velocity history for charting.

        Returns data points for the velocity chart, showing
        messages per second over the last N seconds.

        Args:
            channel: Channel to get history for
            window_seconds: How many seconds of history

        Returns:
            List of {timestamp, velocity} dicts
        """
        now = datetime.now(timezone.utc)
        history = []

        for i in range(window_seconds, 0, -1):
            # Calculate velocity at each second in the past
            point_time = now - timedelta(seconds=i)
            window_start = point_time - timedelta(seconds=1)

            messages = self.buffer.get_messages_since(channel, window_start)
            # Filter to just messages in that 1-second window
            velocity = sum(
                1 for m in messages
                if m.timestamp >= window_start and m.timestamp < point_time
            )

            history.append({
                "timestamp": point_time.isoformat(),
                "velocity": velocity
            })

        return history
