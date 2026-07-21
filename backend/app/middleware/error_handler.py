"""
Error Handler Middleware

Responsibility:
- Catch and format exceptions
- Return consistent error responses
- Log errors
"""

import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.utils.exceptions import EVELabException

logger = logging.getLogger(__name__)


class ErrorHandler:
    """
    Handle exceptions and format error responses.
    """

    @staticmethod
    async def eve_lab_exception_handler(
        request: Request, exc: EVELabException
    ) -> JSONResponse:
        """
        Handle custom EVELabException.

        Args:
            request: FastAPI request
            exc: Exception

        Returns:
            JSON error response
        """
        logger.error(f"EVELabException: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.message,
                "status_code": exc.status_code,
                "path": str(request.url.path),
            },
        )

    @staticmethod
    async def general_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """
        Handle general exceptions.

        Args:
            request: FastAPI request
            exc: Exception

        Returns:
            JSON error response
        """
        logger.error(f"Unhandled exception: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "Internal server error",
                "status_code": 500,
                "path": str(request.url.path),
            },
        )
