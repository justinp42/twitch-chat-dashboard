"""
Configuration Management for Twitch Chat Intelligence Platform

This module uses Pydantic's BaseSettings to manage application configuration.
Settings are loaded from environment variables and .env files.

How it works:
1. Pydantic looks for a .env file in the current directory
2. Each setting maps to an environment variable (case-insensitive)
3. Environment variables override .env file values
4. Type conversion is automatic (e.g., "10000" -> 10000 for integers)

Usage:
    from app.config import settings
    print(settings.twitch_client_id)
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    All settings can be overridden by setting the corresponding
    environment variable (e.g., TWITCH_CLIENT_ID=xxx).
    """

    # Twitch API Credentials
    # These are required for connecting to Twitch IRC
    twitch_client_id: str = ""
    twitch_client_secret: str = ""
    twitch_access_token: str = ""

    # Application Settings
    # Channels to monitor on startup (comma-separated string)
    default_channels: str = "jasontheween"

    # Maximum messages to keep in memory per channel
    # Higher = more history for metrics, but more memory usage
    # 10,000 messages * ~500 bytes = ~5MB per channel
    message_buffer_size: int = 10000

    # Database Settings
    # SQLite is used for storing hype events
    database_url: str = "sqlite+aiosqlite:///./twitch_chat.db"

    # Server Settings
    # CORS origins allowed to connect to the API
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Pydantic Settings Configuration
    model_config = SettingsConfigDict(
        # Load from .env file if it exists
        env_file=".env",
        # Allow extra fields (future-proofing)
        extra="ignore",
        # Environment variables are case-insensitive
        case_sensitive=False,
    )

    @property
    def channels_list(self) -> List[str]:
        """
        Convert comma-separated channels string to a list.

        Example:
            "jasontheween,shroud,xqc" -> ["jasontheween", "shroud", "xqc"]
        """
        return [ch.strip() for ch in self.default_channels.split(",") if ch.strip()]

    @property
    def cors_origins_list(self) -> List[str]:
        """
        Convert comma-separated CORS origins to a list.

        Example:
            "http://localhost:5173,http://localhost:3000" -> ["http://localhost:5173", "http://localhost:3000"]
        """
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.

    Using @lru_cache ensures we only load settings once,
    which is more efficient and guarantees consistency.

    Usage:
        settings = get_settings()
        # or import directly:
        from app.config import settings
    """
    return Settings()


# Create a default settings instance for easy importing
# Usage: from app.config import settings
settings = get_settings()
