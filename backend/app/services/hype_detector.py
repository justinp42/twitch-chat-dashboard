"""
Hype Detector Service

Statistical spike detection for chat velocity.
Detects when current velocity exceeds 2 standard deviations above
the rolling 60-second mean.

Algorithm:
  Spike Detected When:
    current_velocity > mean(last_60_seconds) + (2 × std_dev(last_60_seconds))

  Cooldown: 30 seconds between alerts per channel
"""

from collections import deque
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Optional
import statistics
import logging

logger = logging.getLogger(__name__)


@dataclass
class HypeEvent:
    """Represents a detected hype moment."""
    channel: str
    timestamp: datetime
    velocity: float
    baseline_mean: float
    baseline_std: float
    multiplier: float  # How many times above baseline
    top_emotes: list  # Trending emotes at moment of spike


class HypeDetector:
    """
    Detects chat velocity spikes using statistical analysis.

    Maintains a rolling window of velocity values per channel
    and triggers alerts when current velocity significantly
    exceeds the baseline.
    """

    def __init__(
        self,
        window_seconds: int = 60,
        threshold_std: float = 2.0,
        cooldown_seconds: int = 30,
        min_velocity: float = 5.0,  # Minimum velocity to trigger hype
    ):
        """
        Initialize hype detector.

        Args:
            window_seconds: Size of rolling window for baseline calculation
            threshold_std: Number of standard deviations above mean to trigger
            cooldown_seconds: Minimum time between alerts per channel
            min_velocity: Minimum messages/sec to consider as hype
        """
        self.window_seconds = window_seconds
        self.threshold_std = threshold_std
        self.cooldown_seconds = cooldown_seconds
        self.min_velocity = min_velocity

        # Rolling velocity windows per channel
        # Each entry is (timestamp, velocity)
        self._velocity_windows: dict[str, deque] = {}

        # Last hype event time per channel (for cooldown)
        self._last_hype: dict[str, datetime] = {}

        logger.info(
            f"HypeDetector initialized: window={window_seconds}s, "
            f"threshold={threshold_std}σ, cooldown={cooldown_seconds}s"
        )

    def record_velocity(self, channel: str, velocity: float) -> None:
        """
        Record a velocity measurement for a channel.

        Args:
            channel: Channel name
            velocity: Current messages per second
        """
        now = datetime.utcnow()

        # Initialize window if needed
        if channel not in self._velocity_windows:
            self._velocity_windows[channel] = deque()

        window = self._velocity_windows[channel]

        # Add new measurement
        window.append((now, velocity))

        # Remove old measurements outside window
        cutoff = now - timedelta(seconds=self.window_seconds)
        while window and window[0][0] < cutoff:
            window.popleft()

    def check_for_hype(
        self,
        channel: str,
        current_velocity: float,
        top_emotes: list = None
    ) -> Optional[HypeEvent]:
        """
        Check if current velocity constitutes a hype moment.

        Args:
            channel: Channel name
            current_velocity: Current messages per second
            top_emotes: Current trending emotes

        Returns:
            HypeEvent if spike detected, None otherwise
        """
        now = datetime.utcnow()

        # Check cooldown
        if channel in self._last_hype:
            time_since_last = (now - self._last_hype[channel]).total_seconds()
            if time_since_last < self.cooldown_seconds:
                return None

        # Need minimum velocity to trigger
        if current_velocity < self.min_velocity:
            return None

        # Get velocity window
        window = self._velocity_windows.get(channel)
        if not window or len(window) < 10:
            # Not enough data for statistical analysis
            return None

        # Extract velocity values
        velocities = [v for _, v in window]

        # Calculate statistics
        try:
            mean = statistics.mean(velocities)
            std = statistics.stdev(velocities) if len(velocities) > 1 else 0
        except statistics.StatisticsError:
            return None

        # Avoid division by zero - if std is 0, any spike is significant
        if std == 0:
            std = 0.1

        # Calculate threshold
        threshold = mean + (self.threshold_std * std)

        # Check if current velocity exceeds threshold
        if current_velocity > threshold:
            # Calculate multiplier (how many times above baseline)
            multiplier = current_velocity / mean if mean > 0 else current_velocity

            # Create hype event
            event = HypeEvent(
                channel=channel,
                timestamp=now,
                velocity=current_velocity,
                baseline_mean=round(mean, 2),
                baseline_std=round(std, 2),
                multiplier=round(multiplier, 2),
                top_emotes=top_emotes or []
            )

            # Update cooldown
            self._last_hype[channel] = now

            logger.info(
                f"HYPE DETECTED in {channel}! "
                f"Velocity: {current_velocity:.1f} msg/s "
                f"(baseline: {mean:.1f} ± {std:.1f}, "
                f"threshold: {threshold:.1f}, "
                f"multiplier: {multiplier:.1f}x)"
            )

            return event

        return None

    def get_baseline(self, channel: str) -> tuple[float, float]:
        """
        Get current baseline statistics for a channel.

        Returns:
            Tuple of (mean, std_dev)
        """
        window = self._velocity_windows.get(channel)
        if not window or len(window) < 2:
            return (0.0, 0.0)

        velocities = [v for _, v in window]
        try:
            mean = statistics.mean(velocities)
            std = statistics.stdev(velocities)
            return (round(mean, 2), round(std, 2))
        except statistics.StatisticsError:
            return (0.0, 0.0)

    def reset_channel(self, channel: str) -> None:
        """Clear all data for a channel."""
        if channel in self._velocity_windows:
            del self._velocity_windows[channel]
        if channel in self._last_hype:
            del self._last_hype[channel]
