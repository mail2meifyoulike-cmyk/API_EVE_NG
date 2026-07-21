"""
Audit Service - Log all user actions for compliance

Responsibility:
- Log user actions
- Track changes
- Compliance and auditing
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)
audit_logger = logging.getLogger("audit")


class AuditService:
    """
    Log all operations for auditing and compliance.
    """

    @staticmethod
    def log_action(
        user: str,
        action: str,
        resource: str,
        resource_id: Any,
        status: str = "success",
        details: Optional[Dict] = None,
    ) -> None:
        """
        Log user action.

        Args:
            user: Username
            action: Action performed (create, update, delete, etc.)
            resource: Resource type (lab, node, deployment, etc.)
            resource_id: Resource ID
            status: Action status (success, failure)
            details: Additional details
        """
        timestamp = datetime.utcnow().isoformat()

        audit_log = {
            "timestamp": timestamp,
            "user": user,
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "status": status,
            "details": details or {},
        }

        # Log to audit logger (configure to write to separate file)
        audit_logger.info(str(audit_log))

        # Also log to standard logger
        if status == "success":
            logger.info(
                f"✓ [{user}] {action} {resource} {resource_id}"
            )
        else:
            logger.warning(
                f"✗ [{user}] {action} {resource} {resource_id}: {details}"
            )

    @staticmethod
    def log_login(user: str, status: str = "success") -> None:
        """
        Log login attempt.

        Args:
            user: Username
            status: success or failure
        """
        timestamp = datetime.utcnow().isoformat()
        audit_log = {
            "timestamp": timestamp,
            "user": user,
            "action": "login",
            "status": status,
        }
        audit_logger.info(str(audit_log))
        if status == "success":
            logger.info(f"✓ User logged in: {user}")
        else:
            logger.warning(f"✗ Login failed for user: {user}")
