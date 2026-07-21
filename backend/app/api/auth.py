"""
Refactored Authentication Router

Uses new modular services and middleware architecture.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app import client
from app.services.eve.auth import EVEngAuthService
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService
from app.utils.validators import InputValidator
from app.utils.exceptions import (
    EVEngAuthenticationError,
    InvalidInputError,
)
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

auth_service = AuthService()


class LoginRequest(BaseModel):
    """Login request schema"""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Login response schema"""
    success: bool
    message: str
    username: str | None = None
    token: str | None = None


class AuthStatusResponse(BaseModel):
    """Auth status response schema"""
    authenticated: bool
    username: str | None = None


@router.post("/login", response_model=LoginResponse, status_code=200)
async def login(
    request: LoginRequest,
    response: JSONResponse,
    db: Session = Depends(get_db),
):
    """
    Authenticate user with EVE-NG.

    Flow:
    1. Frontend sends username/password to backend
    2. Backend validates input
    3. Backend authenticates with EVE-NG
    4. Backend creates JWT token
    5. Backend sets secure HTTP-only cookie
    6. Returns success to frontend

    Never:
    - Frontend should not call EVE-NG directly
    - Frontend should not store EVE-NG credentials
    """
    try:
        # Step 1: Validate input
        if not request.username or not request.password:
            raise InvalidInputError("Username and password are required")

        # Sanitize input
        username = InputValidator.sanitize_string(request.username, max_length=100)
        password = InputValidator.sanitize_string(request.password, max_length=100)

        logger.info(f"[AUTH] Login attempt for user: {username}")

        # Step 2: Get EVE-NG client
        eve_ng_client = client.get_eve_ng_client()
        if not eve_ng_client:
            logger.error("[AUTH] EVE-NG client not initialized")
            AuditService.log_login(username, status="failure")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="EVE-NG service not available",
            )

        # Step 3: Create auth service and authenticate
        eve_auth_service = EVEngAuthService(eve_ng_client._client)  # Access HTTP client
        auth_result = await eve_auth_service.login(username, password)

        if not auth_result:
            logger.warning(f"[AUTH] Authentication failed for user: {username}")
            AuditService.log_login(username, status="failure")
            raise EVEngAuthenticationError("Invalid credentials")

        # Step 4: Generate JWT token
        token = auth_service.generate_token(user_id="1", username=username)

        # Step 5: Set secure HTTP-only cookie
        response = JSONResponse(
            content={
                "success": True,
                "message": "Login successful",
                "username": username,
                "token": token,
            },
            status_code=200,
        )
        response.set_cookie(
            key="eve_ng_session",
            value=token,
            httponly=True,  # Cannot be accessed via JavaScript
            secure=True,  # Only sent over HTTPS
            samesite="strict",  # CSRF protection
            max_age=86400,  # 24 hours
        )

        logger.info(f"[AUTH] Authentication successful for user: {username}")
        AuditService.log_login(username, status="success")

        return response

    except InvalidInputError as e:
        logger.warning(f"[AUTH] Validation error: {e.message}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except EVEngAuthenticationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error(f"[AUTH] Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error",
        )


@router.post("/logout", status_code=200)
async def logout(response: JSONResponse):
    """
    Logout user and clear session.
    """
    try:
        logger.info("[AUTH] Logout request")

        # Try to logout from EVE-NG
        eve_ng_client = client.get_eve_ng_client()
        if eve_ng_client:
            try:
                eve_auth_service = EVEngAuthService(eve_ng_client._client)
                await eve_auth_service.logout()
            except Exception as e:
                logger.warning(f"[AUTH] EVE-NG logout error: {str(e)}")

        # Clear session cookie
        response = JSONResponse(
            content={"success": True, "message": "Logout successful"}, status_code=200
        )
        response.delete_cookie(
            key="eve_ng_session",
            httponly=True,
            secure=True,
            samesite="strict",
        )

        logger.info("[AUTH] Logout successful")
        return response

    except Exception as e:
        logger.error(f"[AUTH] Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed",
        )


@router.get("/status", response_model=AuthStatusResponse)
async def auth_status():
    """
    Check authentication status.
    """
    try:
        eve_ng_client = client.get_eve_ng_client()

        if not eve_ng_client:
            return AuthStatusResponse(authenticated=False, username=None)

        eve_auth_service = EVEngAuthService(eve_ng_client._client)
        if eve_auth_service.is_authenticated():
            return AuthStatusResponse(
                authenticated=True,
                username=eve_auth_service.current_user,
            )

        return AuthStatusResponse(authenticated=False, username=None)

    except Exception as e:
        logger.error(f"[AUTH] Status check error: {str(e)}")
        return AuthStatusResponse(authenticated=False, username=None)
