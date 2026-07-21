"""
Authentication Router
Handles login, logout, and authentication status for EVE-NG users.
All EVE-NG API calls are made from this router on behalf of the frontend.
"""

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from app import client
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class LoginRequest(BaseModel):
    """Frontend login request"""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Login response"""
    success: bool
    message: str
    username: str | None = None


class AuthStatusResponse(BaseModel):
    """Authentication status response"""
    authenticated: bool
    username: str | None = None


@router.post("/login")
async def login(request: LoginRequest, response: Response):
    """
    Authenticate user with EVE-NG.
    
    CORRECT FLOW:
    1. Frontend sends username/password to backend
    2. Backend calls EVE-NG /auth/login
    3. Backend sets secure session cookie
    4. Backend returns success to frontend
    
    NEVER:
    - Frontend should not call EVE-NG directly
    - Frontend should not store EVE-NG credentials
    """
    logger.info(f"[AUTH] Login attempt for user: {request.username}")
    
    # Validate input
    if not request.username or not request.password:
        logger.warning("[AUTH] Login failed: Missing username or password")
        raise HTTPException(status_code=400, detail="Username and password required")
    
    # Get EVE-NG client
    eve_ng = client.get_eve_ng_client()
    if not eve_ng:
        logger.error("[AUTH] EVE-NG client not initialized")
        raise HTTPException(
            status_code=503,
            detail="EVE-NG connection not available"
        )
    
    # Authenticate with EVE-NG
    try:
        auth_result = eve_ng.login(request.username, request.password)
        
        if not auth_result or not auth_result.get("status") == "success":
            logger.warning(f"[AUTH] Authentication failed for user: {request.username}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Extract auth token from EVE-NG response
        auth_token = auth_result.get("data", {}).get("auth_token")
        
        # ✓ BACKEND stores session in HTTP-only cookie
        # This ensures frontend cannot access it (XSS protection)
        response.set_cookie(
            key="eve_ng_session",
            value=auth_token,
            httponly=True,  # ← Frontend cannot access via JavaScript
            secure=True,     # ← Only sent over HTTPS
            samesite="strict",  # ← CSRF protection
            max_age=3600 * 24  # ← 24 hours
        )
        
        logger.info(f"[AUTH] Authentication successful for user: {request.username}")
        
        return LoginResponse(
            success=True,
            message="Login successful",
            username=request.username
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AUTH] Login error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Authentication service error"
        )


@router.post("/logout")
async def logout(response: Response):
    """
    Logout user from EVE-NG.
    Clears session cookie.
    """
    logger.info("[AUTH] Logout request")
    
    eve_ng = client.get_eve_ng_client()
    if eve_ng:
        try:
            eve_ng.logout()
            logger.info("[AUTH] Logout successful")
        except Exception as e:
            logger.warning(f"[AUTH] EVE-NG logout error: {str(e)}")
    
    # Clear session cookie
    response.delete_cookie(
        key="eve_ng_session",
        httponly=True,
        secure=True,
        samesite="strict"
    )
    
    return {"success": True, "message": "Logout successful"}


@router.get("/status")
async def auth_status():
    """
    Check authentication status.
    Returns whether user is authenticated and their username.
    """
    eve_ng = client.get_eve_ng_client()
    
    if not eve_ng or not eve_ng.auth_token:
        return AuthStatusResponse(
            authenticated=False,
            username=None
        )
    
    return AuthStatusResponse(
        authenticated=True,
        username=eve_ng.current_user
    )
