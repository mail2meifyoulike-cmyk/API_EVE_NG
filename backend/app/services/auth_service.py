"""
Authentication Service - JWT and session management

Responsibility:
- JWT token generation and validation
- Session management
- User context
"""

import logging
from typing import Optional, Dict
from datetime import datetime, timedelta
import jwt
import os

logger = logging.getLogger(__name__)


class AuthService:
    """
    Manage user authentication and sessions.
    """

    def __init__(self):
        self.secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
        self.algorithm = "HS256"
        self.token_expiry = 24  # hours

    def generate_token(self, user_id: str, username: str) -> str:
        """
        Generate JWT token.

        Args:
            user_id: User ID
            username: Username

        Returns:
            JWT token
        """
        try:
            payload = {
                "user_id": user_id,
                "username": username,
                "exp": datetime.utcnow() + timedelta(hours=self.token_expiry),
                "iat": datetime.utcnow(),
            }
            token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
            logger.info(f"✓ Generated token for user: {username}")
            return token
        except Exception as e:
            logger.error(f"Error generating token: {str(e)}")
            raise

    def validate_token(self, token: str) -> Optional[Dict]:
        """
        Validate JWT token.

        Args:
            token: JWT token

        Returns:
            Token payload or None if invalid
        """
        try:
            payload = jwt.decode(
                token, self.secret_key, algorithms=[self.algorithm]
            )
            logger.debug(f"✓ Token validated for user: {payload.get('username')}")
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return None
