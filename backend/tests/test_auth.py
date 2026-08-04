# Backend Authentication Tests

import pytest
from fastapi import status

class TestAuth:
    """Test authentication endpoints"""

    def test_register_user_success(self, client, test_user_data):
        """Test successful user registration"""
        response = client.post("/auth/register", json=test_user_data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["username"] == test_user_data["username"]
        assert response.json()["email"] == test_user_data["email"]
        assert "password" not in response.json()

    def test_register_user_duplicate_username(self, client, test_user_data):
        """Test registration with duplicate username"""
        # First registration
        client.post("/auth/register", json=test_user_data)
        
        # Second registration with same username
        response = client.post("/auth/register", json=test_user_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already exists" in response.json()["detail"]

    def test_login_success(self, client, test_user_data):
        """Test successful login"""
        # Register user first
        client.post("/auth/register", json=test_user_data)
        
        # Login
        response = client.post(
            "/auth/login",
            json={"username": test_user_data["username"], "password": test_user_data["password"]}
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.json()
        assert response.json()["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client, test_user_data):
        """Test login with invalid credentials"""
        # Register user
        client.post("/auth/register", json=test_user_data)
        
        # Login with wrong password
        response = client.post(
            "/auth/login",
            json={"username": test_user_data["username"], "password": "wrongpassword"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid credentials" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        response = client.post(
            "/auth/login",
            json={"username": "nonexistent", "password": "password"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_current_user(self, client, test_user_data, auth_headers):
        """Test getting current user info"""
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["username"] == test_user_data["username"]

    def test_get_current_user_unauthorized(self, client):
        """Test getting current user without authentication"""
        response = client.get("/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout(self, client, auth_headers):
        """Test logout"""
        response = client.post("/auth/logout", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK

    def test_refresh_token(self, client, test_user_data):
        """Test token refresh"""
        # Register and login
        client.post("/auth/register", json=test_user_data)
        login_response = client.post(
            "/auth/login",
            json={"username": test_user_data["username"], "password": test_user_data["password"]}
        )
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh token
        response = client.post(
            "/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.json()
