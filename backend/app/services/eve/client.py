"""
EVE-NG HTTP Client - Base class for all EVE-NG API communication

Responsibility:
- Handle HTTP requests/responses
- Manage session and cookies
- SSL/TLS configuration
- Request/response logging
- Error handling and retries
"""

import requests
import logging
from typing import Dict, Optional, Any
from urllib3.exceptions import InsecureRequestWarning

# Suppress SSL warnings for self-signed certificates
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

logger = logging.getLogger(__name__)


class EVEngHTTPClient:
    """
    Base HTTP client for EVE-NG API communication.
    Handles low-level HTTP operations.
    """

    def __init__(
        self,
        host: str,
        port: int = 443,
        protocol: str = "https",
        verify_ssl: bool = False,
        timeout: int = 30,
    ):
        """
        Initialize HTTP client.

        Args:
            host: EVE-NG server hostname
            port: EVE-NG API port
            protocol: https or http
            verify_ssl: SSL certificate verification
            timeout: Request timeout in seconds
        """
        self.host = host
        self.port = port
        self.protocol = protocol
        self.verify_ssl = verify_ssl
        self.timeout = timeout
        self.base_url = f"{protocol}://{host}:{port}"
        self.session = requests.Session()
        self.session.verify = verify_ssl

        logger.info(f"EVE-NG HTTP Client initialized: {host}:{port}")

    def get(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """
        Make GET request to EVE-NG API.

        Args:
            endpoint: API endpoint (e.g., "/api/labs")
            params: Query parameters

        Returns:
            Response data or None if failed
        """
        return self._request("GET", endpoint, params=params)

    def post(
        self,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
    ) -> Optional[Dict]:
        """
        Make POST request to EVE-NG API.

        Args:
            endpoint: API endpoint
            data: Request body data
            params: Query parameters

        Returns:
            Response data or None if failed
        """
        return self._request("POST", endpoint, data=data, params=params)

    def put(
        self,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
    ) -> Optional[Dict]:
        """
        Make PUT request to EVE-NG API.

        Args:
            endpoint: API endpoint
            data: Request body data
            params: Query parameters

        Returns:
            Response data or None if failed
        """
        return self._request("PUT", endpoint, data=data, params=params)

    def delete(
        self,
        endpoint: str,
        params: Optional[Dict] = None,
    ) -> Optional[Dict]:
        """
        Make DELETE request to EVE-NG API.

        Args:
            endpoint: API endpoint
            params: Query parameters

        Returns:
            Response data or None if failed
        """
        return self._request("DELETE", endpoint, params=params)

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
    ) -> Optional[Dict]:
        """
        Internal method to make HTTP requests.

        Args:
            method: HTTP method
            endpoint: API endpoint
            data: Request body
            params: Query parameters

        Returns:
            Parsed JSON response or None if failed
        """
        try:
            url = f"{self.base_url}{endpoint}"
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
            }

            response = self.session.request(
                method,
                url,
                json=data,
                params=params,
                headers=headers,
                timeout=self.timeout,
                verify=self.verify_ssl,
            )

            # Log request
            logger.debug(f"{method} {endpoint} - Status: {response.status_code}")

            # Handle successful responses
            if response.status_code in [200, 201, 204]:
                if response.text:
                    return response.json()
                return {"status": "success"}

            # Handle errors
            logger.error(
                f"EVE-NG API error {response.status_code}: {response.text[:200]}"
            )
            return None

        except requests.exceptions.Timeout:
            logger.error(f"Request timeout: {endpoint}")
            return None
        except requests.exceptions.ConnectionError:
            logger.error(f"Connection error to {self.host}:{self.port}")
            return None
        except Exception as e:
            logger.error(f"Request error: {str(e)}")
            return None

    def close(self):
        """Close session."""
        self.session.close()
        logger.info("HTTP Client session closed")
