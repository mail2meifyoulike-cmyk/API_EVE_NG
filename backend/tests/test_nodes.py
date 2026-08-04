# Backend Nodes Tests

import pytest
from fastapi import status

class TestNodes:
    """Test nodes endpoints"""

    @pytest.fixture
    def lab_id(self, client, auth_headers):
        """Create a lab for testing"""
        lab_data = {"name": "Test Lab", "description": "Test"}
        response = client.post("/labs", json=lab_data, headers=auth_headers)
        return response.json()["id"]

    def test_create_node(self, client, auth_headers, lab_id):
        """Test creating a node"""
        node_data = {
            "name": "Router1",
            "type": "router",
            "image": "vios"
        }
        response = client.post(
            f"/labs/{lab_id}/nodes",
            json=node_data,
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["name"] == node_data["name"]
        assert response.json()["type"] == node_data["type"]

    def test_get_all_nodes(self, client, auth_headers, lab_id):
        """Test getting all nodes in a lab"""
        # Create a node
        node_data = {"name": "Router1", "type": "router", "image": "vios"}
        client.post(f"/labs/{lab_id}/nodes", json=node_data, headers=auth_headers)
        
        # Get all nodes
        response = client.get(f"/labs/{lab_id}/nodes", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) > 0

    def test_get_node_by_id(self, client, auth_headers, lab_id):
        """Test getting a specific node"""
        # Create a node
        node_data = {"name": "Router1", "type": "router", "image": "vios"}
        create_response = client.post(
            f"/labs/{lab_id}/nodes",
            json=node_data,
            headers=auth_headers
        )
        node_id = create_response.json()["id"]
        
        # Get specific node
        response = client.get(f"/labs/{lab_id}/nodes/{node_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == node_id

    def test_update_node(self, client, auth_headers, lab_id):
        """Test updating a node"""
        # Create a node
        node_data = {"name": "Router1", "type": "router", "image": "vios"}
        create_response = client.post(
            f"/labs/{lab_id}/nodes",
            json=node_data,
            headers=auth_headers
        )
        node_id = create_response.json()["id"]
        
        # Update node
        updated_data = {"name": "UpdatedRouter", "type": "router", "image": "vios"}
        response = client.put(
            f"/labs/{lab_id}/nodes/{node_id}",
            json=updated_data,
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["name"] == updated_data["name"]

    def test_delete_node(self, client, auth_headers, lab_id):
        """Test deleting a node"""
        # Create a node
        node_data = {"name": "Router1", "type": "router", "image": "vios"}
        create_response = client.post(
            f"/labs/{lab_id}/nodes",
            json=node_data,
            headers=auth_headers
        )
        node_id = create_response.json()["id"]
        
        # Delete node
        response = client.delete(f"/labs/{lab_id}/nodes/{node_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK

    def test_start_node(self, client, auth_headers, lab_id):
        """Test starting a node"""
        # Create a node
        node_data = {"name": "Router1", "type": "router", "image": "vios"}
        create_response = client.post(
            f"/labs/{lab_id}/nodes",
            json=node_data,
            headers=auth_headers
        )
        node_id = create_response.json()["id"]
        
        # Start node
        response = client.post(
            f"/labs/{lab_id}/nodes/{node_id}/start",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "running"

    def test_stop_node(self, client, auth_headers, lab_id):
        """Test stopping a node"""
        # Create and start a node
        node_data = {"name": "Router1", "type": "router", "image": "vios"}
        create_response = client.post(
            f"/labs/{lab_id}/nodes",
            json=node_data,
            headers=auth_headers
        )
        node_id = create_response.json()["id"]
        client.post(f"/labs/{lab_id}/nodes/{node_id}/start", headers=auth_headers)
        
        # Stop node
        response = client.post(
            f"/labs/{lab_id}/nodes/{node_id}/stop",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "stopped"
