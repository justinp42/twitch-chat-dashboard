"""
Hype Event Repository

Data access layer for hype events.
Handles CRUD operations and exports.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime
import json

from ...models.hype_event import HypeEventModel
from ...services.hype_detector import HypeEvent


class HypeEventRepository:
    """Repository for hype event persistence."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, event: HypeEvent) -> HypeEventModel:
        """
        Save a new hype event to database.

        Args:
            event: HypeEvent dataclass from detector

        Returns:
            Created database model
        """
        db_event = HypeEventModel(
            channel=event.channel,
            timestamp=event.timestamp,
            velocity=event.velocity,
            baseline_mean=event.baseline_mean,
            baseline_std=event.baseline_std,
            multiplier=event.multiplier,
            top_emotes_json=json.dumps(event.top_emotes) if event.top_emotes else None,
        )

        self.session.add(db_event)
        await self.session.commit()
        await self.session.refresh(db_event)

        return db_event

    async def get_all(
        self,
        channel: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[HypeEventModel]:
        """
        Get hype events with optional filtering.

        Args:
            channel: Filter by channel name (optional)
            limit: Maximum events to return
            offset: Pagination offset

        Returns:
            List of hype events
        """
        query = select(HypeEventModel).order_by(desc(HypeEventModel.timestamp))

        if channel:
            query = query.where(HypeEventModel.channel == channel)

        query = query.offset(offset).limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, event_id: int) -> Optional[HypeEventModel]:
        """Get a single hype event by ID."""
        result = await self.session.execute(
            select(HypeEventModel).where(HypeEventModel.id == event_id)
        )
        return result.scalar_one_or_none()

    async def get_recent(
        self,
        channel: Optional[str] = None,
        hours: int = 24,
    ) -> list[HypeEventModel]:
        """
        Get recent hype events within time window.

        Args:
            channel: Filter by channel (optional)
            hours: Hours to look back

        Returns:
            List of recent events
        """
        from datetime import timedelta

        cutoff = datetime.utcnow() - timedelta(hours=hours)

        query = (
            select(HypeEventModel)
            .where(HypeEventModel.timestamp >= cutoff)
            .order_by(desc(HypeEventModel.timestamp))
        )

        if channel:
            query = query.where(HypeEventModel.channel == channel)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def export_csv(self, channel: Optional[str] = None) -> str:
        """
        Export hype events as CSV string.

        Args:
            channel: Filter by channel (optional)

        Returns:
            CSV formatted string
        """
        events = await self.get_all(channel=channel, limit=10000)

        lines = [HypeEventModel.csv_header()]
        for event in events:
            lines.append(event.to_csv_row())

        return "\n".join(lines)

    async def count(self, channel: Optional[str] = None) -> int:
        """Count total hype events."""
        from sqlalchemy import func

        query = select(func.count(HypeEventModel.id))

        if channel:
            query = query.where(HypeEventModel.channel == channel)

        result = await self.session.execute(query)
        return result.scalar() or 0
