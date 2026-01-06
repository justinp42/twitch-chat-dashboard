"""
CLI Test Script for Twitch Chat Connection

This script tests the Twitch IRC connection independently
of the full FastAPI application. It's useful for:

1. Verifying your Twitch credentials work
2. Testing the connection without the full app
3. Debugging IRC connection issues
4. Seeing raw chat messages in real-time

Usage:
    1. Copy .env.example to .env and fill in your credentials
    2. Run: python cli_test.py
    3. Watch chat messages appear in your terminal
    4. Press Ctrl+C to stop

What You Should See:
    [TwitchClient] Connected as your_username
    [TwitchClient] Monitoring channels: jasontheween
    [jasontheween] CoolUser123: Hello everyone!
    [jasontheween] AnotherViewer: KEKW
    ...
"""

import asyncio
import sys
import io
from datetime import datetime

# Fix Windows console encoding for Unicode characters (emojis, special chars)
# This is needed because Twitch chat often contains Unicode that Windows cmd can't display
# line_buffering=True ensures output appears immediately instead of being buffered
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

# Add the parent directory to Python path so we can import our modules
# This is needed because we're running from the backend/ directory
sys.path.insert(0, ".")

from app.config import settings
from app.services.twitch_client import TwitchChatClient
from app.services.message_buffer import MessageBuffer
from app.models.chat_message import ChatMessage


# Create a message buffer to store messages
buffer = MessageBuffer(maxlen=1000)

# Statistics tracking
stats = {
    "total_messages": 0,
    "start_time": None,
    "emotes_seen": {},
}


def handle_message(message: ChatMessage) -> None:
    """
    Handle incoming chat messages.

    This callback is called for every message received from Twitch.
    We print it to the console and store it in the buffer.

    Args:
        message: Parsed ChatMessage object
    """
    # Track statistics
    stats["total_messages"] += 1

    # Track emotes
    for emote in message.emotes:
        stats["emotes_seen"][emote] = stats["emotes_seen"].get(emote, 0) + 1

    # Store in buffer
    buffer.add_message(message.channel, message)

    # Format timestamp
    time_str = message.timestamp.strftime("%H:%M:%S")

    # Format badges (show first badge if any)
    badge_str = ""
    if message.badges:
        badge_str = f"[{message.badges[0]}] "

    # Format emotes (show if any)
    emote_str = ""
    if message.emotes:
        emote_str = f" (emotes: {', '.join(message.emotes)})"

    # Print the message
    print(f"[{time_str}] [{message.channel}] {badge_str}{message.username}: {message.content}{emote_str}")


async def print_stats_periodically():
    """
    Print statistics every 30 seconds.

    Shows message rate, buffer size, and top emotes.
    """
    while True:
        await asyncio.sleep(30)

        if stats["start_time"]:
            elapsed = (datetime.utcnow() - stats["start_time"]).total_seconds()
            rate = stats["total_messages"] / elapsed if elapsed > 0 else 0

            print("\n" + "=" * 50)
            print(f"STATS (running for {elapsed:.0f} seconds)")
            print(f"  Total messages: {stats['total_messages']}")
            print(f"  Average rate: {rate:.2f} msg/sec")
            print(f"  Buffer stats: {buffer.get_stats()}")

            # Top 5 emotes
            if stats["emotes_seen"]:
                top_emotes = sorted(
                    stats["emotes_seen"].items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:5]
                print(f"  Top emotes: {top_emotes}")

            print("=" * 50 + "\n")


async def main():
    """
    Main entry point for the CLI test.

    Sets up the Twitch client and runs until interrupted.
    """
    print("=" * 50)
    print("Twitch Chat Intelligence - Connection Test")
    print("=" * 50)

    # Check if credentials are configured
    if not settings.twitch_access_token or settings.twitch_access_token == "oauth:your_access_token_here":
        print("\nERROR: Twitch credentials not configured!")
        print("\nTo fix this:")
        print("1. Copy .env.example to .env")
        print("2. Get your credentials from https://dev.twitch.tv/console")
        print("3. Generate an access token at https://twitchtokengenerator.com")
        print("4. Fill in your .env file with the credentials")
        print("\nSee DEVELOPMENT_LOG.md for detailed instructions.")
        return

    # Get channels to monitor
    channels = settings.channels_list
    print(f"\nChannels to monitor: {channels}")
    print(f"Access token: {settings.twitch_access_token[:15]}...")
    print("\nConnecting to Twitch IRC...")

    # Create the Twitch client
    client = TwitchChatClient(
        token=settings.twitch_access_token,
        channels=channels,
        message_callback=handle_message
    )

    # Record start time for statistics
    stats["start_time"] = datetime.utcnow()

    # Start the stats printer in the background
    stats_task = asyncio.create_task(print_stats_periodically())

    try:
        # Start the client (this runs forever until interrupted)
        print("\nListening for messages... (Press Ctrl+C to stop)\n")
        await client.start()
    except KeyboardInterrupt:
        print("\n\nShutting down...")
    except Exception as e:
        print(f"\nError: {e}")
        print("\nCommon issues:")
        print("  - Invalid access token: Generate a new one at twitchtokengenerator.com")
        print("  - Channel doesn't exist: Check the channel name spelling")
        print("  - Rate limited: Wait a few minutes and try again")
        raise
    finally:
        # Cancel the stats task
        stats_task.cancel()

        # Print final statistics
        if stats["total_messages"] > 0:
            elapsed = (datetime.utcnow() - stats["start_time"]).total_seconds()
            print(f"\nFinal stats:")
            print(f"  Total messages received: {stats['total_messages']}")
            print(f"  Running time: {elapsed:.0f} seconds")
            print(f"  Average rate: {stats['total_messages'] / elapsed:.2f} msg/sec")


if __name__ == "__main__":
    # Run the async main function
    # asyncio.run() handles creating and closing the event loop
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nGoodbye!")
