"""
EVE-NG Nodes Service

Responsibility:
- Node operations (list, get)
- Node lifecycle (start, stop)
- Node status and interfaces
"""

import logging
from typing import Optional, List, Dict, Any
from app.services.eve.client import EVEngHTTPClient

logger = logging.getLogger(__name__)


class EVEngNodesService:
    """
    Handle node operations on EVE-NG.
    """

    def __init__(self, client: EVEngHTTPClient):
        """
        Initialize nodes service.

        Args:
            client: EVEngHTTPClient instance
        """
        self.client = client

    async def list_nodes(self, lab_id: str) -> List[Dict[str, Any]]:
        """
        Get all nodes in a lab.

        Args:
            lab_id: Lab ID

        Returns:
            List of nodes or empty list if failed
        """
        try:
            response = self.client.get(f"/api/labs/{lab_id}/nodes")
            if response and "data" in response:
                nodes = response["data"]
                logger.info(f"✓ Retrieved {len(nodes)} nodes from lab {lab_id}")
                return nodes
            return []
        except Exception as e:
            logger.error(f"Error listing nodes in lab {lab_id}: {str(e)}")
            return []

    async def get_node(
        self, lab_id: str, node_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get node details.

        Args:
            lab_id: Lab ID
            node_id: Node ID

        Returns:
            Node details or None if failed
        """
        try:
            response = self.client.get(f"/api/labs/{lab_id}/nodes/{node_id}")
            if response and "data" in response:
                return response["data"]
            return None
        except Exception as e:
            logger.error(
                f"Error getting node {node_id} in lab {lab_id}: {str(e)}"
            )
            return None

    async def start_node(self, lab_id: str, node_id: str) -> bool:
        """
        Start a node (power on).

        Args:
            lab_id: Lab ID
            node_id: Node ID

        Returns:
            True if successful, False otherwise
        """
        try:
            response = self.client.put(
                f"/api/labs/{lab_id}/nodes/{node_id}/start"
            )
            if response is not None:
                logger.info(f"✓ Started node {node_id} in lab {lab_id}")
                return True
            return False
        except Exception as e:
            logger.error(
                f"Error starting node {node_id} in lab {lab_id}: {str(e)}"
            )
            return False

    async def stop_node(self, lab_id: str, node_id: str) -> bool:
        """
        Stop a node (power off).

        Args:
            lab_id: Lab ID
            node_id: Node ID

        Returns:
            True if successful, False otherwise
        """
        try:
            response = self.client.put(
                f"/api/labs/{lab_id}/nodes/{node_id}/stop"
            )
            if response is not None:
                logger.info(f"✓ Stopped node {node_id} in lab {lab_id}")
                return True
            return False
        except Exception as e:
            logger.error(
                f"Error stopping node {node_id} in lab {lab_id}: {str(e)}"
            )
            return False

    async def get_node_interfaces(
        self, lab_id: str, node_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get node interfaces.

        Args:
            lab_id: Lab ID
            node_id: Node ID

        Returns:
            List of interfaces or empty list if failed
        """
        try:
            response = self.client.get(
                f"/api/labs/{lab_id}/nodes/{node_id}/interfaces"
            )
            if response and "data" in response:
                return response["data"]
            return []
        except Exception as e:
            logger.error(
                f"Error getting interfaces for node {node_id}: {str(e)}"
            )
            return []
