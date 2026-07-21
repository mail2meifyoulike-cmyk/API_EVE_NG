"""
Cache Service - Caching layer for EVE-NG responses

Responsibility:
- Cache management
- TTL handling
- Cache invalidation
"""

import logging
from typing import Optional, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class CacheService:
    """
    Simple in-memory cache for EVE-NG responses.
    
    Note: For production, use Redis or similar.
    """

    def __init__(self):
        self.cache: dict = {}

    def get(self, key: str) -> Optional[Any]:
        """
        Get cached value.

        Args:
            key: Cache key

        Returns:
            Cached value or None if expired/missing
        """
        if key not in self.cache:
            return None

        item = self.cache[key]
        if item["expires_at"] < datetime.utcnow():
            del self.cache[key]
            return None

        return item["value"]

    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        """
        Set cached value.

        Args:
            key: Cache key
            value: Value to cache
            ttl_seconds: Time to live in seconds (default 5 minutes)
        """
        self.cache[key] = {
            "value": value,
            "expires_at": datetime.utcnow() + timedelta(seconds=ttl_seconds),
        }
        logger.debug(f"Cached: {key} (TTL: {ttl_seconds}s)")

    def delete(self, key: str) -> None:
        """
        Delete cached value.

        Args:
            key: Cache key
        """
        if key in self.cache:
            del self.cache[key]
            logger.debug(f"Cache deleted: {key}")

    def clear(self) -> None:
        """
        Clear all cache.
        """
        self.cache.clear()
        logger.info("Cache cleared")
