from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.database import engine, Base
from app.routers import labs, deployments, status

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")
    yield
    # Shutdown
    logger.info("Application shutting down")

app = FastAPI(
    title="EVE Lab Automation API",
    description="API for managing lab automation, deployment, and provisioning",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(labs.router, prefix="/api/labs", tags=["labs"])
app.include_router(deployments.router, prefix="/api/deployments", tags=["deployments"])
app.include_router(status.router, prefix="/api/status", tags=["status"])

@app.get("/")
async def root():
    return {
        "message": "EVE Lab Automation API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
