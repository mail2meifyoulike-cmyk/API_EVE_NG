"""
EVE-NG Authentication Service

Responsibility:
- Handle login/logout
- Manage authentication tokens
- Validate authentication state
"""

import logging
from typing import Optional, Dict, Any
from app.services.eve.client import EVEngHTTPClient

logger = logging.getLogger(__name__)


class EVEngAuthService:
    """
    Handle EVE-NG authentication.
    """

    def __init__(self, client: EVEngHTTPClient):
        """
        Initialize auth service.

        Args:
            client: EVEngHTTPClient instance
        """
        self.client = client
        self.auth_token = None
        self.current_user = None

    def login(self, username: str, password: str) -> bool:
        """
        Authenticate with EVE-NG.

        Args:
            username: Admin username
            password: Admin password

        Returns:
            True if authentication successful, False otherwise
        """
        try:
            response = self.client.post(
                "/api/auth/login",
                data={"username": username, "password": password},
            )

            if response and response.get("status") in ["ok", "success"]:
                self.auth_token = True
                self.current_user = username
                logger.info(f"✓ Authenticated as {username}")
                return True

            logger.error(f"Authentication failed for {username}")
            return False

        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return False

    def logout(self) -> bool:
        """
        Logout from EVE-NG.

        Returns:
            True if logout successful, False otherwise
        """
        try:
            response = self.client.post("/api/auth/logout")
            self.auth_token = None
            self.current_user = None
            logger.info("✓ Logged out")
            return response is not None
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return False

    def is_authenticated(self) -> bool:
        """
        Check if authenticated.

        Returns:
            True if authenticated, False otherwise
        """
        return self.auth_token is not None
