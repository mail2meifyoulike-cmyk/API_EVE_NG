"""
Authentication Middleware

Responsibility:
- Validate JWT tokens
- Extract user context
- Enforce authentication on protected routes
"""

import logging
from typing import Optional
from fastapi import Request, HTTPException, status
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)
auth_service = AuthService()


class AuthMiddleware:
    """
    Middleware to validate JWT tokens and extract user context.
    """

    @staticmethod
    def get_current_user(request: Request) -> Optional[Dict]:
        """
        Extract and validate user from request.

        Args:
            request: FastAPI request object

        Returns:
            User context dictionary

        Raises:
            HTTPException if authentication fails
        """
        # Get token from cookie
        token = request.cookies.get("eve_ng_session")

        if not token:
            # Try Authorization header
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header[7:]
            else:
                logger.warning("No authentication token provided")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                    headers={"WWW-Authenticate": "Bearer"},
                )

        # Validate token
        payload = auth_service.validate_token(token)
        if not payload:
            logger.warning("Invalid or expired token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "user_id": payload.get("user_id"),
            "username": payload.get("username"),
        }

    @staticmethod
    def require_auth(request: Request) -> Dict:
        """
        Dependency for protecting routes.
        Use with: current_user = Depends(AuthMiddleware.require_auth)

        Args:
            request: FastAPI request object

        Returns:
            User context
        """
        return AuthMiddleware.get_current_user(request)
