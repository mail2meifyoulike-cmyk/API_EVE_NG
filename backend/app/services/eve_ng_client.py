"""
EVE-NG API Client for real server communication
Credentials are sourced from environment variables only - NO HARDCODED VALUES
Uses official EVE-NG API specifications with cookie-based authentication
"""
import requests
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import ssl
from urllib3.exceptions import InsecureRequestWarning
import os

# Suppress SSL warnings for self-signed certificates
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

logger = logging.getLogger(__name__)


class EVEng:
    """
    EVE-NG API Client for production environment communication
    Implements official EVE-NG REST API specifications
    All credentials must be provided via environment variables
    Uses cookie-based authentication as per official documentation
    """

    def __init__(
        self,
        host: str,
        port: int = 443,
        username: str = None,
        password: str = None,
        protocol: str = "https",
        verify_ssl: bool = False,
        timeout: int = 30,
    ):
        """
        Initialize EVE-NG API Client

        Args:
            host: EVE-NG server hostname or FQDN
            port: EVE-NG API port (default 443)
            username: Admin username (from environment)
            password: Admin password (from environment)
            protocol: https or http
            verify_ssl: SSL certificate verification
            timeout: Request timeout in seconds

        Note:
            Username and password MUST be provided from environment variables.
            They should never be hardcoded.
            Uses cookie-based authentication as per official EVE-NG API docs.
        """
        if not username or not password:
            raise ValueError(
                "EVE_NG_USERNAME and EVE_NG_PASSWORD environment variables must be set"
            )

        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.protocol = protocol
        self.verify_ssl = verify_ssl
        self.timeout = timeout
        self.session = requests.Session()
        self.session.verify = verify_ssl
        self.base_url = f"{protocol}://{host}:{port}"
        self.auth_token = True  # Flag to indicate authentication state
        self.cookie_jar = None

        logger.info(f"EVE-NG Client initialized for {host}:{port}")

    def connect(self) -> bool:
        """
        Authenticate with EVE-NG server using cookie-based authentication

        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            url = f"{self.base_url}/api/auth/login"
            payload = {"username": self.username, "password": self.password}

            response = self.session.post(
                url,
                json=payload,
                timeout=self.timeout,
                verify=self.verify_ssl,
            )

            if response.status_code == 200:
                data = response.json()
                # Check for success in response
                if data.get("status") == "ok" or data.get("code") == 200:
                    self.auth_token = True
                    logger.info(f"✓ Connected to EVE-NG server: {self.host}:{self.port}")
                    return True
                else:
                    logger.error(
                        f"✗ EVE-NG authentication failed: {data.get('message', 'Unknown error')}"
                    )
                    return False
            else:
                logger.error(
                    f"✗ EVE-NG authentication failed: {response.status_code}"
                )
                return False

        except requests.exceptions.ConnectionError as e:
            logger.error(f"✗ Connection error to EVE-NG: {str(e)}")
            return False
        except requests.exceptions.Timeout as e:
            logger.error(f"✗ Timeout connecting to EVE-NG: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"✗ Error connecting to EVE-NG: {str(e)}")
            return False

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication token"""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        return headers

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
    ) -> Optional[Dict]:
        """
        Make API request to EVE-NG

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint
            data: Request body data
            params: Query parameters

        Returns:
            Response data or None if request failed
        """
        try:
            url = f"{self.base_url}/api{endpoint}"
            headers = self._get_headers()

            if method == "GET":
                response = self.session.get(
                    url,
                    headers=headers,
                    params=params,
                    timeout=self.timeout,
                    verify=self.verify_ssl,
                )
            elif method == "POST":
                response = self.session.post(
                    url,
                    headers=headers,
                    json=data,
                    params=params,
                    timeout=self.timeout,
                    verify=self.verify_ssl,
                )
            elif method == "PUT":
                response = self.session.put(
                    url,
                    headers=headers,
                    json=data,
                    params=params,
                    timeout=self.timeout,
                    verify=self.verify_ssl,
                )
            elif method == "DELETE":
                response = self.session.delete(
                    url,
                    headers=headers,
                    params=params,
                    timeout=self.timeout,
                    verify=self.verify_ssl,
                )
            else:
                logger.error(f"Unsupported HTTP method: {method}")
                return None

            if response.status_code in [200, 201, 204]:
                if response.text:
                    return response.json()
                return {"status": "success"}
            else:
                logger.error(
                    f"EVE-NG API error {response.status_code}: {response.text}"
                )
                return None

        except Exception as e:
            logger.error(f"Request error: {str(e)}")
            return None

    # Lab Management APIs
    # Note: Lab paths in EVE-NG are hierarchical (e.g., /Admin/Lab1)

    def get_labs(self) -> Optional[List[Dict]]:
        """Get all labs from EVE-NG"""
        response = self._make_request("GET", "/labs")
        if response and "data" in response:
            return response["data"]
        return []

    def get_lab(self, lab_path: str) -> Optional[Dict]:
        """Get specific lab details
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
        """
        response = self._make_request("GET", f"/labs{lab_path}")
        if response and "data" in response:
            return response["data"]
        return None

    def get_lab_status(self, lab_path: str) -> Optional[Dict]:
        """Get lab status and statistics
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
        """
        response = self._make_request("GET", f"/labs{lab_path}/status")
        if response:
            return response.get("data", response)
        return None

    def create_lab(self, lab_name: str, description: str = "") -> Optional[Dict]:
        """Create a new lab"""
        payload = {"name": lab_name, "description": description}
        response = self._make_request("POST", "/labs", data=payload)
        if response and "data" in response:
            return response["data"]
        return response

    def delete_lab(self, lab_path: str) -> bool:
        """Delete a lab
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
        """
        response = self._make_request("DELETE", f"/labs{lab_path}")
        return response is not None

    def start_lab(self, lab_path: str) -> bool:
        """Start a lab (power on all nodes)
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
        """
        response = self._make_request("PUT", f"/labs{lab_path}/start")
        return response is not None

    def stop_lab(self, lab_path: str) -> bool:
        """Stop a lab (power off all nodes)
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
        """
        response = self._make_request("PUT", f"/labs{lab_path}/stop")
        return response is not None

    # Node Management APIs

    def get_lab_nodes(self, lab_path: str) -> Optional[List[Dict]]:
        """Get all nodes in a lab
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
        """
        response = self._make_request("GET", f"/labs{lab_path}/nodes")
        if response and "data" in response:
            return response["data"]
        return []

    def get_node(self, lab_path: str, node_id: str) -> Optional[Dict]:
        """Get specific node details
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
            node_id: Node ID
        """
        response = self._make_request("GET", f"/labs{lab_path}/nodes/{node_id}")
        if response and "data" in response:
            return response["data"]
        return None

    def start_node(self, lab_path: str, node_id: str) -> bool:
        """Start a node (power on)
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
            node_id: Node ID
        """
        response = self._make_request("PUT", f"/labs{lab_path}/nodes/{node_id}/start")
        return response is not None

    def stop_node(self, lab_path: str, node_id: str) -> bool:
        """Stop a node (power off)
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
            node_id: Node ID
        """
        response = self._make_request("PUT", f"/labs{lab_path}/nodes/{node_id}/stop")
        return response is not None

    # Interface APIs

    def get_node_interfaces(self, lab_path: str, node_id: str) -> Optional[List[Dict]]:
        """Get node interfaces
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
            node_id: Node ID
        """
        response = self._make_request(
            "GET", f"/labs{lab_path}/nodes/{node_id}/interfaces"
        )
        if response and "data" in response:
            return response["data"]
        return []

    # Network APIs

    def get_networks(self, lab_path: str) -> Optional[List[Dict]]:
        """Get all networks in a lab
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
        """
        response = self._make_request("GET", f"/labs{lab_path}/networks")
        if response and "data" in response:
            return response["data"]
        return []

    # User APIs

    def get_users(self) -> Optional[List[Dict]]:
        """Get all users"""
        response = self._make_request("GET", "/users")
        if response and "data" in response:
            return response["data"]
        return []

    # System APIs

    def get_system_info(self) -> Optional[Dict]:
        """Get EVE-NG system information"""
        response = self._make_request("GET", "/system/info")
        if response and "data" in response:
            return response["data"]
        return response

    def get_system_status(self) -> Optional[Dict]:
        """Get EVE-NG system status and statistics"""
        response = self._make_request("GET", "/system/status")
        if response and "data" in response:
            return response["data"]
        return response

    def get_system_resources(self) -> Optional[Dict]:
        """Get system CPU, memory, and disk statistics"""
        response = self._make_request("GET", "/system/resources")
        if response and "data" in response:
            return response["data"]
        return response

    # Snapshot APIs

    def get_snapshots(self, lab_path: str) -> Optional[List[Dict]]:
        """Get all snapshots for a lab
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
        """
        response = self._make_request("GET", f"/labs{lab_path}/snapshots")
        if response and "data" in response:
            return response["data"]
        return []

    def create_snapshot(self, lab_path: str, snapshot_name: str) -> Optional[Dict]:
        """Create a snapshot of the current lab state
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
            snapshot_name: Name for the snapshot
        """
        payload = {"name": snapshot_name}
        response = self._make_request("POST", f"/labs{lab_path}/snapshots", data=payload)
        if response and "data" in response:
            return response["data"]
        return response

    def restore_snapshot(self, lab_path: str, snapshot_id: str) -> bool:
        """Restore lab from snapshot
        
        Args:
            lab_path: Lab path (e.g., /Admin/Lab1)
            snapshot_id: Snapshot ID
        """
        response = self._make_request(
            "PUT", f"/labs{lab_path}/snapshots/{snapshot_id}/restore"
        )
        return response is not None

    # Topology APIs

    def get_topologies(self) -> Optional[List[Dict]]:
        """Get all available topologies"""
        response = self._make_request("GET", "/topologies")
        if response and "data" in response:
            return response["data"]
        return []

    def get_topology(self, topology_id: str) -> Optional[Dict]:
        """Get specific topology details"""
        response = self._make_request("GET", f"/topologies/{topology_id}")
        if response and "data" in response:
            return response["data"]
        return None

    # Health Check

    def health_check(self) -> Dict[str, Any]:
        """
        Check EVE-NG server health

        Returns:
            Dictionary with health status
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/system/info",
                timeout=5,
                verify=self.verify_ssl,
            )
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "healthy",
                    "connected": True,
                    "host": self.host,
                    "port": self.port,
                    "version": data.get("data", {}).get("version", "unknown"),
                }
            else:
                return {
                    "status": "unhealthy",
                    "connected": False,
                    "host": self.host,
                    "port": self.port,
                    "error": f"Status code: {response.status_code}",
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "connected": False,
                "host": self.host,
                "port": self.port,
                "error": str(e),
            }

    def disconnect(self) -> bool:
        """Logout from EVE-NG using official API logout endpoint"""
        try:
            response = self._make_request("POST", "/auth/logout")
            self.auth_token = False
            logger.info("Disconnected from EVE-NG")
            return True
        except Exception as e:
            logger.error(f"Error disconnecting: {str(e)}")
            return False
