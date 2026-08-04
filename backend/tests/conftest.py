# Backend Unit Tests Configuration

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_user_data():
    return {
        "username": "testuser",
        "password": "testpassword123",
        "email": "test@example.com"
    }

@pytest.fixture
def auth_headers(client, test_user_data):
    # Register user
    client.post("/auth/register", json=test_user_data)
    
    # Login
    response = client.post(
        "/auth/login",
        json={"username": test_user_data["username"], "password": test_user_data["password"]}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
