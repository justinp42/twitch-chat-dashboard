"""
Twitch IRC Client Service

This module handles the connection to Twitch's IRC (Internet Relay Chat) servers
using the twitchio library. It's responsible for:
1. Connecting to Twitch IRC
2. Joining chat channels
3. Parsing incoming messages
4. Converting raw IRC data to our ChatMessage model

How Twitch Chat Works (IRC Protocol)
------------------------------------
Twitch uses IRC, a 1988 protocol that's still widely used today.
The basic flow is:

1. Connect to irc.chat.twitch.tv on port 6667 (or 6697 for SSL)
2. Authenticate: PASS oauth:your_token
3. Set nickname: NICK your_username
4. Join channel: JOIN #channelname
5. Receive messages in format:
   :username!username@username.tmi.twitch.tv PRIVMSG #channel :Hello world!

Why twitchio?
-------------
Instead of manually handling IRC protocol, twitchio:
- Manages socket connections automatically
- Handles PING/PONG keepalive messages
- Parses IRC messages into Python objects
- Auto-reconnects on disconnection
- Handles rate limiting (Twitch limits join rate)
- Provides easy access to emotes, badges, and tags

Understanding Async Programming
-------------------------------
This client uses async/await because:
- IRC connections are I/O-bound (waiting for network)
- We might monitor many channels with thousands of messages/sec
- Async allows handling multiple operations concurrently
- While waiting for one message, we can process others

Example of why async matters:
  Sync:  Wait for msg1 (100ms) -> Wait for msg2 (100ms) = 200ms
  Async: Start waiting for msg1, msg2 simultaneously = 100ms total
"""

from twitchio.ext import commands
from twitchio import Message
from datetime import datetime, timezone
from typing import Callable, List, Optional, Set
import asyncio
import logging

from ..models.chat_message import ChatMessage

# Set up logging for debugging
logger = logging.getLogger(__name__)


class TwitchChatClient(commands.Bot):
    """
    A Twitch IRC client that connects to channels and processes chat messages.

    This class extends twitchio's commands.Bot to add our custom functionality:
    - Message parsing into ChatMessage model
    - Callback system for message handling
    - Channel management (join/leave dynamically)

    Attributes:
        message_callback: Function called for each new message
        _connected_channels: Set of channels we're currently in
        _is_ready: Whether the bot has connected successfully

    Usage:
        async def handle_message(msg: ChatMessage):
            print(f"{msg.username}: {msg.content}")

        client = TwitchChatClient(
            token="oauth:xxx",
            channels=["jasontheween"],
            message_callback=handle_message
        )
        await client.start()
    """

    def __init__(
        self,
        token: str,
        channels: List[str],
        message_callback: Optional[Callable[[ChatMessage], None]] = None
    ):
        """
        Initialize the Twitch chat client.

        Args:
            token: OAuth access token (format: "oauth:xxxxx" or just "xxxxx")
            channels: List of channel names to join (without # prefix)
            message_callback: Async function to call for each message

        Note:
            The token must have the 'chat:read' scope at minimum.
            Get one at https://twitchtokengenerator.com
        """
        # Ensure token has oauth: prefix
        if not token.startswith("oauth:"):
            token = f"oauth:{token}"

        # Initialize the parent Bot class
        # prefix='!' means commands start with ! (we don't use commands, but it's required)
        # initial_channels joins these channels on connect
        super().__init__(
            token=token,
            prefix="!",
            initial_channels=channels
        )

        # Store the callback function for processing messages
        self.message_callback = message_callback

        # Track which channels we're connected to
        self._connected_channels: Set[str] = set(channels)

        # Track connection status
        self._is_ready: bool = False

        logger.info(f"TwitchChatClient initialized for channels: {channels}")

    async def event_ready(self):
        """
        Called when the bot has connected and is ready.

        This is an event handler that twitchio calls automatically
        when the IRC connection is established and authenticated.
        """
        self._is_ready = True
        logger.info(f"Connected to Twitch IRC as {self.nick}")
        logger.info(f"Joined channels: {self._connected_channels}")
        print(f"[TwitchClient] Connected as {self.nick}")
        print(f"[TwitchClient] Monitoring channels: {', '.join(self._connected_channels)}")

    async def event_message(self, message: Message):
        """
        Called for every chat message received.

        This is the core event handler. For every message in any
        channel we're monitoring, this method:
        1. Ignores our own messages (echo messages)
        2. Parses the raw IRC data into our ChatMessage model
        3. Calls the callback function with the parsed message

        Args:
            message: twitchio Message object with all IRC data
        """
        # Ignore messages from ourselves (echo)
        # This happens when the bot sends messages, which we don't do
        if message.echo:
            return

        # Parse the twitchio message into our ChatMessage model
        parsed_message = self._parse_message(message)

        # Call the callback if one was provided
        if self.message_callback:
            # Check if callback is async or sync
            if asyncio.iscoroutinefunction(self.message_callback):
                await self.message_callback(parsed_message)
            else:
                self.message_callback(parsed_message)

    def _parse_message(self, message: Message) -> ChatMessage:
        """
        Convert a twitchio Message into our ChatMessage model.

        This extracts all relevant data from the raw IRC message:
        - Message ID and content
        - Author username and badges
        - Channel name
        - Emotes used in the message
        - Timestamp

        Args:
            message: Raw twitchio Message object

        Returns:
            ChatMessage: Our standardized message model
        """
        # Extract emotes from the message
        # twitchio provides emotes as a list of Emote objects
        emotes = self._extract_emotes(message)

        # Extract badges from the author
        # Badges are things like "subscriber", "moderator", "vip"
        badges = self._extract_badges(message)

        # Get the channel name (remove # prefix if present)
        channel = message.channel.name if message.channel else "unknown"

        # Get username - prefer display name over login name
        username = message.author.display_name if message.author else "unknown"

        # Get message ID - Twitch provides this in tags
        msg_id = message.tags.get("id", "") if message.tags else ""

        # Get timestamp - Twitch provides this as tmi-sent-ts (milliseconds)
        timestamp = self._extract_timestamp(message)

        return ChatMessage(
            id=msg_id,
            channel=channel,
            username=username,
            content=message.content or "",
            timestamp=timestamp,
            emotes=emotes,
            badges=badges
        )

    def _extract_emotes(self, message: Message) -> List[str]:
        """
        Extract emote codes from a message.

        Twitch tags messages with emote information. Each emote includes:
        - The emote ID (numeric)
        - The emote name/code (what users type)
        - Position in the message

        We extract just the names for analytics.

        Args:
            message: twitchio Message object

        Returns:
            List of emote codes (e.g., ["LUL", "KEKW"])
        """
        emotes = []

        # twitchio parses emotes from the IRC tags
        if hasattr(message, "tags") and message.tags:
            emote_tag = message.tags.get("emotes", "")
            if emote_tag:
                # Emote format: "emote_id:start-end,start-end/emote_id2:start-end"
                # We need to extract from the message content using positions
                try:
                    for emote_data in emote_tag.split("/"):
                        if ":" in emote_data:
                            emote_id, positions = emote_data.split(":", 1)
                            # Get the first position to extract the emote text
                            if positions and message.content:
                                first_pos = positions.split(",")[0]
                                start, end = map(int, first_pos.split("-"))
                                emote_name = message.content[start:end + 1]
                                if emote_name and emote_name not in emotes:
                                    emotes.append(emote_name)
                except (ValueError, IndexError) as e:
                    logger.debug(f"Error parsing emotes: {e}")

        return emotes

    def _extract_badges(self, message: Message) -> List[str]:
        """
        Extract badge names from a message author.

        Badges indicate special status:
        - broadcaster: The channel owner
        - moderator: Channel mod
        - vip: VIP status
        - subscriber: Subscribed to channel
        - premium: Twitch Prime/Turbo

        Args:
            message: twitchio Message object

        Returns:
            List of badge names (e.g., ["subscriber", "vip"])
        """
        badges = []

        if message.author and hasattr(message.author, "badges"):
            # twitchio provides badges as a dict or set
            author_badges = message.author.badges
            if isinstance(author_badges, dict):
                badges = list(author_badges.keys())
            elif isinstance(author_badges, (list, set)):
                badges = list(author_badges)

        return badges

    def _extract_timestamp(self, message: Message) -> datetime:
        """
        Extract timestamp from message tags.

        Twitch includes the server timestamp in the 'tmi-sent-ts' tag
        as milliseconds since Unix epoch. We convert to datetime.

        Args:
            message: twitchio Message object

        Returns:
            datetime: Message timestamp in UTC
        """
        if message.tags and "tmi-sent-ts" in message.tags:
            try:
                # tmi-sent-ts is milliseconds since epoch
                ms_timestamp = int(message.tags["tmi-sent-ts"])
                return datetime.fromtimestamp(ms_timestamp / 1000, tz=timezone.utc)
            except (ValueError, TypeError):
                pass

        # Fallback to current time
        return datetime.now(timezone.utc)

    async def join_channel(self, channel: str):
        """
        Join a new channel dynamically.

        This allows adding channels after the bot is already running.
        Useful for the API endpoint that lets users add channels.

        Args:
            channel: Channel name to join (without # prefix)
        """
        if channel not in self._connected_channels:
            await self.join_channels([channel])
            self._connected_channels.add(channel)
            logger.info(f"Joined channel: {channel}")
            print(f"[TwitchClient] Joined channel: {channel}")

    async def leave_channel(self, channel: str):
        """
        Leave a channel dynamically.

        This allows removing channels while the bot is running.
        Useful for the API endpoint that lets users remove channels.

        Args:
            channel: Channel name to leave (without # prefix)
        """
        if channel in self._connected_channels:
            await self.part_channels([channel])
            self._connected_channels.discard(channel)
            logger.info(f"Left channel: {channel}")
            print(f"[TwitchClient] Left channel: {channel}")

    @property
    def is_ready(self) -> bool:
        """Check if the client is connected and ready."""
        return self._is_ready

    @property
    def connected_channels(self) -> Set[str]:
        """Get the set of currently connected channels."""
        return self._connected_channels.copy()
