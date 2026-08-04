# Integration Tests Configuration

import pytest
import asyncio
from httpx import AsyncClient
from app.main import app
from app.database import get_db, Base, engine
from sqlalchemy.orm import sessionmaker

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_integration.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def client():
    """Create a test client with an async context manager."""
    Base.metadata.create_all(bind=engine)
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
async def test_user(client):
    """Create a test user and return auth token."""
    user_data = {
        "username": "testuser",
        "password": "testpassword123",
        "email": "test@example.com"
    }
    await client.post("/auth/register", json=user_data)
    response = await client.post(
        "/auth/login",
        json={"username": user_data["username"], "password": user_data["password"]}
    )
    token = response.json()["access_token"]
    return {"token": token, "user": user_data}
