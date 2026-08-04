# Backend Labs Tests

import pytest
from fastapi import status

class TestLabs:
    """Test labs endpoints"""

    def test_create_lab(self, client, auth_headers):
        """Test creating a new lab"""
        lab_data = {
            "name": "Test Lab",
            "description": "Test lab description"
        }
        response = client.post(
            "/labs",
            json=lab_data,
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["name"] == lab_data["name"]
        assert response.json()["description"] == lab_data["description"]
        assert "id" in response.json()

    def test_create_lab_unauthorized(self, client):
        """Test creating lab without authentication"""
        lab_data = {"name": "Test Lab", "description": "Test"}
        response = client.post("/labs", json=lab_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_all_labs(self, client, auth_headers):
        """Test getting all labs"""
        # Create a lab first
        lab_data = {"name": "Test Lab", "description": "Test"}
        create_response = client.post("/labs", json=lab_data, headers=auth_headers)
        lab_id = create_response.json()["id"]
        
        # Get all labs
        response = client.get("/labs", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) > 0
        assert any(lab["id"] == lab_id for lab in response.json())

    def test_get_lab_by_id(self, client, auth_headers):
        """Test getting a specific lab"""
        # Create a lab
        lab_data = {"name": "Test Lab", "description": "Test"}
        create_response = client.post("/labs", json=lab_data, headers=auth_headers)
        lab_id = create_response.json()["id"]
        
        # Get specific lab
        response = client.get(f"/labs/{lab_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == lab_id
        assert response.json()["name"] == lab_data["name"]

    def test_get_nonexistent_lab(self, client, auth_headers):
        """Test getting a non-existent lab"""
        response = client.get("/labs/99999", headers=auth_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_lab(self, client, auth_headers):
        """Test updating a lab"""
        # Create a lab
        lab_data = {"name": "Test Lab", "description": "Test"}
        create_response = client.post("/labs", json=lab_data, headers=auth_headers)
        lab_id = create_response.json()["id"]
        
        # Update lab
        updated_data = {"name": "Updated Lab", "description": "Updated description"}
        response = client.put(
            f"/labs/{lab_id}",
            json=updated_data,
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["name"] == updated_data["name"]
        assert response.json()["description"] == updated_data["description"]

    def test_delete_lab(self, client, auth_headers):
        """Test deleting a lab"""
        # Create a lab
        lab_data = {"name": "Test Lab", "description": "Test"}
        create_response = client.post("/labs", json=lab_data, headers=auth_headers)
        lab_id = create_response.json()["id"]
        
        # Delete lab
        response = client.delete(f"/labs/{lab_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        
        # Verify lab is deleted
        get_response = client.get(f"/labs/{lab_id}", headers=auth_headers)
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

    def test_start_lab(self, client, auth_headers):
        """Test starting a lab"""
        # Create a lab
        lab_data = {"name": "Test Lab", "description": "Test"}
        create_response = client.post("/labs", json=lab_data, headers=auth_headers)
        lab_id = create_response.json()["id"]
        
        # Start lab
        response = client.post(f"/labs/{lab_id}/start", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "running"

    def test_stop_lab(self, client, auth_headers):
        """Test stopping a lab"""
        # Create and start a lab
        lab_data = {"name": "Test Lab", "description": "Test"}
        create_response = client.post("/labs", json=lab_data, headers=auth_headers)
        lab_id = create_response.json()["id"]
        client.post(f"/labs/{lab_id}/start", headers=auth_headers)
        
        # Stop lab
        response = client.post(f"/labs/{lab_id}/stop", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "stopped"
