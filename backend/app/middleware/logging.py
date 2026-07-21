"""
Logging Middleware

Responsibility:
- Log all requests and responses
- Track performance
- Debug information
"""

import logging
import time
from fastapi import Request

logger = logging.getLogger(__name__)


class LoggingMiddleware:
    """
    Log HTTP requests and responses.
    """

    @staticmethod
    async def log_request(request: Request, call_next):
        """
        Log incoming request and outgoing response.

        Args:
            request: FastAPI request
            call_next: Next middleware/handler

        Returns:
            Response
        """
        # Start timing
        start_time = time.time()

        # Get request info
        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"

        # Log request
        logger.info(f"{method} {path} from {client_ip}")

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration = time.time() - start_time

        # Log response
        logger.info(
            f"{method} {path} - Status: {response.status_code} - Duration: {duration:.2f}s"
        )

        # Add custom headers
        response.headers["X-Process-Time"] = str(duration)

        return response
