"""
Hype Events API Routes

REST endpoints for accessing hype event history.
"""

from fastapi import APIRouter, Query, Response
from fastapi.responses import PlainTextResponse
from typing import Optional

from ...db.database import async_session
from ...db.repositories.hype_event_repo import HypeEventRepository

router = APIRouter()


@router.get("/hype-events")
async def get_hype_events(
    channel: Optional[str] = Query(None, description="Filter by channel"),
    limit: int = Query(50, ge=1, le=500, description="Max events to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """
    Get list of hype events.

    Returns recent hype events, optionally filtered by channel.
    """
    async with async_session() as session:
        repo = HypeEventRepository(session)
        events = await repo.get_all(channel=channel, limit=limit, offset=offset)
        count = await repo.count(channel=channel)

        return {
            "events": [event.to_dict() for event in events],
            "total": count,
            "limit": limit,
            "offset": offset,
        }


@router.get("/hype-events/recent")
async def get_recent_hype_events(
    channel: Optional[str] = Query(None, description="Filter by channel"),
    hours: int = Query(24, ge=1, le=168, description="Hours to look back"),
):
    """
    Get hype events from the last N hours.
    """
    async with async_session() as session:
        repo = HypeEventRepository(session)
        events = await repo.get_recent(channel=channel, hours=hours)

        return {
            "events": [event.to_dict() for event in events],
            "hours": hours,
            "count": len(events),
        }


@router.get("/hype-events/export", response_class=PlainTextResponse)
async def export_hype_events(
    channel: Optional[str] = Query(None, description="Filter by channel"),
):
    """
    Export hype events as CSV file.
    """
    async with async_session() as session:
        repo = HypeEventRepository(session)
        csv_content = await repo.export_csv(channel=channel)

        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=hype_events_{channel or 'all'}.csv"
            },
        )


@router.get("/hype-events/{event_id}")
async def get_hype_event(event_id: int):
    """
    Get a single hype event by ID.
    """
    async with async_session() as session:
        repo = HypeEventRepository(session)
        event = await repo.get_by_id(event_id)

        if not event:
            return {"error": "Event not found"}, 404

        return event.to_dict()
