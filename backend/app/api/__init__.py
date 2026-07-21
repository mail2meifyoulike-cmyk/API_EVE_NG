"""
API routers __init__.py

Expose all routers for main.py
"""

from app.api import auth, labs

__all__ = ["auth", "labs"]
