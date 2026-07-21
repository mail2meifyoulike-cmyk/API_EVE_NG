"""
EVE-NG Labs Service

Responsibility:
- Lab operations (list, create, update, delete)
- Lab lifecycle (start, stop)
- Lab status monitoring
"""

import logging
from typing import Optional, List, Dict, Any
from app.services.eve.client import EVEngHTTPClient

logger = logging.getLogger(__name__)


class EVEngLabsService:
    """
    Handle lab operations on EVE-NG.
    """

    def __init__(self, client: EVEngHTTPClient):
        """
        Initialize labs service.

        Args:
            client: EVEngHTTPClient instance
        """
        self.client = client

    async def list_labs(self) -> List[Dict[str, Any]]:
        """
        Get all labs.

        Returns:
            List of labs or empty list if failed
        """
        try:
            response = self.client.get("/api/labs")
            if response and "data" in response:
                labs = response["data"]
                logger.info(f"✓ Retrieved {len(labs)} labs")
                return labs
            return []
        except Exception as e:
            logger.error(f"Error listing labs: {str(e)}")
            return []

    async def get_lab(self, lab_id: str) -> Optional[Dict[str, Any]]:
        """
        Get lab details.

        Args:
            lab_id: Lab ID

        Returns:
            Lab details or None if failed
        """
        try:
            response = self.client.get(f"/api/labs/{lab_id}")
            if response and "data" in response:
                return response["data"]
            return None
        except Exception as e:
            logger.error(f"Error getting lab {lab_id}: {str(e)}")
            return None

    async def get_lab_status(self, lab_id: str) -> Optional[Dict[str, Any]]:
        """
        Get lab status.

        Args:
            lab_id: Lab ID

        Returns:
            Lab status or None if failed
        """
        try:
            response = self.client.get(f"/api/labs/{lab_id}/status")
            if response:
                return response.get("data", response)
            return None
        except Exception as e:
            logger.error(f"Error getting lab status {lab_id}: {str(e)}")
            return None

    async def create_lab(
        self, name: str, description: str = ""
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new lab.

        Args:
            name: Lab name
            description: Lab description

        Returns:
            Created lab data or None if failed
        """
        try:
            response = self.client.post(
                "/api/labs",
                data={"name": name, "description": description},
            )
            if response:
                logger.info(f"✓ Created lab: {name}")
                return response.get("data", response)
            return None
        except Exception as e:
            logger.error(f"Error creating lab: {str(e)}")
            return None

    async def delete_lab(self, lab_id: str) -> bool:
        """
        Delete a lab.

        Args:
            lab_id: Lab ID

        Returns:
            True if successful, False otherwise
        """
        try:
            response = self.client.delete(f"/api/labs/{lab_id}")
            if response is not None:
                logger.info(f"✓ Deleted lab: {lab_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting lab {lab_id}: {str(e)}")
            return False

    async def start_lab(self, lab_id: str) -> bool:
        """
        Start a lab (power on all nodes).

        Args:
            lab_id: Lab ID

        Returns:
            True if successful, False otherwise
        """
        try:
            response = self.client.put(f"/api/labs/{lab_id}/start")
            if response is not None:
                logger.info(f"✓ Started lab: {lab_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error starting lab {lab_id}: {str(e)}")
            return False

    async def stop_lab(self, lab_id: str) -> bool:
        """
        Stop a lab (power off all nodes).

        Args:
            lab_id: Lab ID

        Returns:
            True if successful, False otherwise
        """
        try:
            response = self.client.put(f"/api/labs/{lab_id}/stop")
            if response is not None:
                logger.info(f"✓ Stopped lab: {lab_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error stopping lab {lab_id}: {str(e)}")
            return False
