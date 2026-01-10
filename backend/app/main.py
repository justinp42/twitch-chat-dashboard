"""
FastAPI Application Entry Point

This is the main application file that:
1. Creates the FastAPI app instance
2. Configures CORS for frontend communication
3. Manages application lifespan (startup/shutdown)
4. Starts the Twitch IRC client
5. Runs the metrics broadcast loop
6. Includes all API routes and WebSocket endpoints

The lifespan context manager handles:
- Starting Twitch client on app startup
- Starting background tasks for metrics broadcasting
- Graceful shutdown of all services
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging

from .config import settings
from .services.twitch_client import TwitchChatClient
from .services.message_buffer import MessageBuffer
from .services.metrics_calculator import MetricsCalculator
from .services.hype_detector import HypeDetector
from .api.routes import channels, health, hype_events
from .api.websockets.metrics_ws import router as metrics_ws_router, manager as ws_manager
from .api.websockets.hype_ws import router as hype_ws_router, hype_manager
from .db.database import init_db, async_session
from .db.repositories.hype_event_repo import HypeEventRepository

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instances
message_buffer = MessageBuffer(maxlen=settings.message_buffer_size)
metrics_calculator = MetricsCalculator(message_buffer)
hype_detector = HypeDetector(
    window_seconds=60,
    threshold_std=2.0,
    cooldown_seconds=30,
    min_velocity=5.0,
)
twitch_client: TwitchChatClient = None
background_tasks = set()


async def handle_twitch_message(message):
    """
    Callback for incoming Twitch messages.
    Adds each message to the buffer for metrics calculation.
    """
    message_buffer.add_message(message.channel, message)


async def broadcast_metrics_loop():
    """
    Background task that broadcasts metrics to all WebSocket clients every second.

    This runs continuously while the app is running:
    1. Get all configured channels (not just ones with messages)
    2. Calculate metrics for each channel
    3. Check for hype events
    4. Broadcast to all connected WebSocket clients
    5. Sleep for 1 second
    6. Repeat
    """
    logger.info("Starting metrics broadcast loop")
    while True:
        try:
            # Use configured channels - always broadcast even if no messages yet
            channels_list = settings.channels_list

            for channel in channels_list:
                # Calculate metrics for this channel (will be zeros if no messages)
                metrics = metrics_calculator.calculate_metrics(channel)

                # Record velocity for hype detection
                hype_detector.record_velocity(channel, metrics.messages_per_second)

                # Check for hype event
                hype_event = hype_detector.check_for_hype(
                    channel=channel,
                    current_velocity=metrics.messages_per_second,
                    top_emotes=metrics.top_emotes,
                )

                # If hype detected, save to database and broadcast
                if hype_event:
                    try:
                        async with async_session() as session:
                            repo = HypeEventRepository(session)
                            await repo.create(hype_event)
                        await hype_manager.broadcast_hype(hype_event)
                    except Exception as e:
                        logger.error(f"Failed to save/broadcast hype event: {e}")

                # Broadcast metrics to all connected WebSocket clients
                await ws_manager.broadcast_metrics(metrics)

            # Wait 1 second before next broadcast
            await asyncio.sleep(1)

        except asyncio.CancelledError:
            logger.info("Metrics broadcast loop cancelled")
            break
        except Exception as e:
            logger.error(f"Error in metrics broadcast loop: {e}")
            await asyncio.sleep(1)  # Still wait to avoid tight error loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    This is called when the app starts and stops:
    - startup: Initialize services, start Twitch client, start broadcast loop
    - shutdown: Cancel background tasks, close connections

    Using asynccontextmanager instead of on_event decorators (deprecated).
    """
    global twitch_client

    # ===== STARTUP =====
    logger.info("Starting Twitch Chat Intelligence Platform...")

    # Initialize database
    await init_db()

    # Create Twitch client
    if settings.twitch_access_token and settings.twitch_access_token != "oauth:your_access_token_here":
        twitch_client = TwitchChatClient(
            token=settings.twitch_access_token,
            channels=settings.channels_list,
            message_callback=handle_twitch_message
        )

        # Start Twitch client in background
        twitch_task = asyncio.create_task(twitch_client.start())
        background_tasks.add(twitch_task)
        twitch_task.add_done_callback(background_tasks.discard)
        logger.info(f"Twitch client started for channels: {settings.channels_list}")
    else:
        logger.warning("Twitch credentials not configured - running without IRC connection")

    # Start metrics broadcast loop
    broadcast_task = asyncio.create_task(broadcast_metrics_loop())
    background_tasks.add(broadcast_task)
    broadcast_task.add_done_callback(background_tasks.discard)

    logger.info("Application startup complete")

    yield  # App is running

    # ===== SHUTDOWN =====
    logger.info("Shutting down...")

    # Cancel all background tasks
    for task in background_tasks:
        task.cancel()

    # Wait for tasks to complete
    if background_tasks:
        await asyncio.gather(*background_tasks, return_exceptions=True)

    # Close Twitch client
    if twitch_client:
        await twitch_client.close()

    logger.info("Shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Twitch Chat Intelligence",
    description="Real-time Twitch chat analytics and hype detection",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
# This allows the React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST API routes
app.include_router(channels.router, prefix="/api", tags=["channels"])
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(hype_events.router, prefix="/api", tags=["hype"])

# Include WebSocket routes
app.include_router(metrics_ws_router)
app.include_router(hype_ws_router)


@app.get("/")
async def root():
    """Root endpoint - basic API info."""
    return {
        "name": "Twitch Chat Intelligence API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }


# Export for use in other modules
def get_message_buffer() -> MessageBuffer:
    """Get the global message buffer instance."""
    return message_buffer


def get_twitch_client() -> TwitchChatClient:
    """Get the global Twitch client instance."""
    return twitch_client


def get_metrics_calculator() -> MetricsCalculator:
    """Get the global metrics calculator instance."""
    return metrics_calculator
