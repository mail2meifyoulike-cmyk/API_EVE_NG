"""
EVE-NG Networks Service

Responsibility:
- Network operations (list, get)
- Network connectivity
- Interface connections
"""

import logging
from typing import Optional, List, Dict, Any
from app.services.eve.client import EVEngHTTPClient

logger = logging.getLogger(__name__)


class EVEngNetworksService:
    """
    Handle network operations on EVE-NG.
    """

    def __init__(self, client: EVEngHTTPClient):
        """
        Initialize networks service.

        Args:
            client: EVEngHTTPClient instance
        """
        self.client = client

    async def list_networks(self, lab_id: str) -> List[Dict[str, Any]]:
        """
        Get all networks in a lab.

        Args:
            lab_id: Lab ID

        Returns:
            List of networks or empty list if failed
        """
        try:
            response = self.client.get(f"/api/labs/{lab_id}/networks")
            if response and "data" in response:
                networks = response["data"]
                logger.info(f"✓ Retrieved {len(networks)} networks from lab {lab_id}")
                return networks
            return []
        except Exception as e:
            logger.error(f"Error listing networks in lab {lab_id}: {str(e)}")
            return []

    async def get_network(
        self, lab_id: str, network_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get network details.

        Args:
            lab_id: Lab ID
            network_id: Network ID

        Returns:
            Network details or None if failed
        """
        try:
            response = self.client.get(f"/api/labs/{lab_id}/networks/{network_id}")
            if response and "data" in response:
                return response["data"]
            return None
        except Exception as e:
            logger.error(
                f"Error getting network {network_id} in lab {lab_id}: {str(e)}"
            )
            return None
