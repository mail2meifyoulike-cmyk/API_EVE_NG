from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
import json
from app.database import engine, Base
from app.routers import labs, deployments, status
from app.services.eve_ng_client import EVEng
from app import client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_cors_origins():
    """Load CORS origins from environment variable"""
    cors_env = os.getenv("CORS_ORIGINS", '["http://localhost:3000"]')
    try:
        return json.loads(cors_env)
    except json.JSONDecodeError:
        logger.warning("Invalid CORS_ORIGINS format, using default")
        return ["http://localhost:3000"]


def initialize_eve_ng_client():
    """Initialize EVE-NG client on startup"""
    
    # Load all EVE-NG configuration from environment variables
    eve_ng_fqdn = os.getenv("EVE_NG_FQDN")
    eve_ng_port = os.getenv("EVE_NG_PORT", "443")
    eve_ng_protocol = os.getenv("EVE_NG_PROTOCOL", "https")
    eve_ng_username = os.getenv("EVE_NG_USERNAME")
    eve_ng_password = os.getenv("EVE_NG_PASSWORD")
    eve_ng_verify_ssl = os.getenv("EVE_NG_VERIFY_SSL", "false").lower() == "true"

    # Validate required environment variables
    if not eve_ng_fqdn:
        logger.error("❌ EVE_NG_FQDN environment variable not set")
        return False
    
    if not eve_ng_username:
        logger.error("❌ EVE_NG_USERNAME environment variable not set")
        return False
    
    if not eve_ng_password:
        logger.error("❌ EVE_NG_PASSWORD environment variable not set")
        return False

    try:
        eve_ng_client = EVEng(
            host=eve_ng_fqdn,
            port=int(eve_ng_port),
            username=eve_ng_username,
            password=eve_ng_password,
            protocol=eve_ng_protocol,
            verify_ssl=eve_ng_verify_ssl,
            timeout=30,
        )

        # Test connection
        if eve_ng_client.connect():
            logger.info(f"✓ EVE-NG client initialized: {eve_ng_fqdn}:{eve_ng_port}")
            # Get system info
            system_info = eve_ng_client.get_system_info()
            if system_info:
                logger.info(f"✓ EVE-NG System: {system_info}")
            client.set_eve_ng_client(eve_ng_client)
            return True
        else:
            logger.warning(
                f"⚠ EVE-NG connection failed. Using database-only mode: {eve_ng_fqdn}:{eve_ng_port}"
            )
            client.set_eve_ng_client(None)
            return False
    except ValueError as e:
        logger.error(f"❌ EVE-NG configuration error: {str(e)}")
        client.set_eve_ng_client(None)
        return False
    except Exception as e:
        logger.warning(f"⚠ EVE-NG initialization error: {str(e)}. Using database-only mode.")
        client.set_eve_ng_client(None)
        return False


# Create tables and initialize EVE-NG on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    logger.info("✓ Database tables created")
    
    # Initialize EVE-NG client
    initialize_eve_ng_client()
    
    yield
    
    # Shutdown
    eve_ng_client = client.get_eve_ng_client()
    if eve_ng_client:
        eve_ng_client.disconnect()
    logger.info("Application shutting down")


app = FastAPI(
    title="EVE Lab Automation API",
    description="API for managing lab automation, deployment, and provisioning with real EVE-NG integration",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS middleware with environment-based configuration
cors_origins = get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS Origins configured: {cors_origins}")

# Include routers
app.include_router(labs.router, prefix="/api/labs", tags=["labs"])
app.include_router(deployments.router, prefix="/api/deployments", tags=["deployments"])
app.include_router(status.router, prefix="/api/status", tags=["status"])


@app.get("/")
async def root():
    eve_ng_client = client.get_eve_ng_client()
    return {
        "message": "EVE Lab Automation API",
        "version": "2.0.0",
        "docs": "/docs",
        "eve_ng_enabled": eve_ng_client is not None and eve_ng_client.auth_token is not None,
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    health_status = {"status": "healthy", "database": "connected"}
    
    eve_ng_client = client.get_eve_ng_client()
    if eve_ng_client:
        eve_ng_health = eve_ng_client.health_check()
        health_status["eve_ng"] = eve_ng_health
    else:
        health_status["eve_ng"] = {"status": "disconnected", "connected": False}
    
    return health_status


@app.get("/api/config")
async def get_config():
    """Get application configuration (environment-based)"""
    eve_ng_client = client.get_eve_ng_client()
    return {
        "app_version": "2.0.0",
        "eve_ng": {
            "fqdn": os.getenv("EVE_NG_FQDN", "not-configured"),
            "port": os.getenv("EVE_NG_PORT", "443"),
            "protocol": os.getenv("EVE_NG_PROTOCOL", "https"),
            "connected": eve_ng_client is not None and eve_ng_client.auth_token is not None,
        },
        "features": {
            "labs": True,
            "deployments": True,
            "real_time_monitoring": eve_ng_client is not None,
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
