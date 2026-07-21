"""
Refactored main.py - Application entry point

Integrates modular services, middleware, and routers.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse
from app import client
from app.services.eve.client import EVEngHTTPClient
from app.middleware.logging import LoggingMiddleware
from app.middleware.error_handler import ErrorHandler
from app.utils.exceptions import EVELabException
from app.api import auth, labs, deployments, status
from app.database import engine, Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def get_cors_origins():
    """
    Get CORS origins from environment variable.
    """
    cors_origins = os.getenv(
        "CORS_ORIGINS",
        '["http://localhost:3000", "http://192.168.109.132:3000"]',
    )
    try:
        import json
        return json.loads(cors_origins)
    except Exception:
        logger.warning("Failed to parse CORS_ORIGINS, using defaults")
        return ["http://localhost:3000", "http://192.168.109.132:3000"]


def initialize_eve_ng_client():
    """
    Initialize EVE-NG client on startup.
    """
    try:
        eve_ng_ip = os.getenv("EVE_NG_IP", "192.168.2.11")
        eve_ng_port = int(os.getenv("EVE_NG_PORT", 8443))
        eve_ng_protocol = os.getenv("EVE_NG_PROTOCOL", "https")

        logger.info(
            f"Initializing EVE-NG client: {eve_ng_protocol}://{eve_ng_ip}:{eve_ng_port}"
        )

        http_client = EVEngHTTPClient(
            host=eve_ng_ip,
            port=eve_ng_port,
            protocol=eve_ng_protocol,
            verify_ssl=False,  # Self-signed certificates
            timeout=30,
        )

        # Set global client
        client.set_eve_ng_client(type("EVEngClient", (), {"_client": http_client})())

        logger.info("✓ EVE-NG client initialized")
    except Exception as e:
        logger.error(f"✗ Failed to initialize EVE-NG client: {str(e)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown.
    """
    # Startup
    logger.info("=" * 50)
    logger.info("API_EVE_NG Backend Starting...")
    logger.info("=" * 50)

    # Create database tables
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("✓ Database tables created")

    # Initialize EVE-NG client
    initialize_eve_ng_client()

    logger.info("✓ Backend ready")
    logger.info("=" * 50)

    yield

    # Shutdown
    logger.info("=" * 50)
    logger.info("API_EVE_NG Backend Shutting Down...")
    logger.info("=" * 50)


# Create FastAPI app
app = FastAPI(
    title="API_EVE_NG",
    description="Backend API for EVE-NG Lab Management",
    version="2.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add logging middleware


@app.middleware("http")
async def logging_middleware(request, call_next):
    return await LoggingMiddleware.log_request(request, call_next)


# Register exception handlers
@app.exception_handler(EVELabException)
async def eve_lab_exception_handler(request, exc):
    return await ErrorHandler.eve_lab_exception_handler(request, exc)


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return await ErrorHandler.general_exception_handler(request, exc)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={
            "detail": "Invalid request",
            "errors": [str(e) for e in exc.errors()],
        },
    )


# Include routers
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"],
)
app.include_router(
    labs.router,
    prefix="/api/labs",
    tags=["Labs"],
)
app.include_router(
    deployments.router,
    prefix="/api/deployments",
    tags=["Deployments"],
)
app.include_router(
    status.router,
    prefix="/api/status",
    tags=["Status"],
)


# Root endpoint
@app.get("/")
async def root():
    """
    API root endpoint.
    """
    return {
        "message": "API_EVE_NG Backend",
        "version": "2.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )
