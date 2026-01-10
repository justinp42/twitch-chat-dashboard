"""
Hype Event Database Model

SQLAlchemy model for persisting detected hype moments.
Stores all relevant data for historical analysis and CSV export.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
import json

from ..db.database import Base


class HypeEventModel(Base):
    """Database model for hype events."""

    __tablename__ = "hype_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    channel = Column(String(100), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    velocity = Column(Float, nullable=False)
    baseline_mean = Column(Float, nullable=False)
    baseline_std = Column(Float, nullable=False)
    multiplier = Column(Float, nullable=False)
    top_emotes_json = Column(Text, nullable=True)  # JSON string of emotes

    @property
    def top_emotes(self) -> list:
        """Get top emotes as list."""
        if self.top_emotes_json:
            try:
                return json.loads(self.top_emotes_json)
            except json.JSONDecodeError:
                return []
        return []

    @top_emotes.setter
    def top_emotes(self, value: list):
        """Set top emotes from list."""
        self.top_emotes_json = json.dumps(value) if value else None

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "channel": self.channel,
            "timestamp": self.timestamp.isoformat() + "Z",
            "velocity": self.velocity,
            "baseline_mean": self.baseline_mean,
            "baseline_std": self.baseline_std,
            "multiplier": self.multiplier,
            "top_emotes": self.top_emotes,
        }

    def to_csv_row(self) -> str:
        """Convert to CSV row string."""
        return (
            f"{self.channel},"
            f"{self.timestamp.isoformat()}Z,"
            f"{self.velocity:.1f},"
            f"{self.baseline_mean:.1f},"
            f"{self.baseline_std:.1f},"
            f"{self.multiplier:.2f}"
        )

    @staticmethod
    def csv_header() -> str:
        """Get CSV header row."""
        return "channel,timestamp,velocity,baseline_mean,baseline_std,multiplier"
