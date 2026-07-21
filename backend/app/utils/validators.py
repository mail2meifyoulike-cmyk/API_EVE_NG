"""
Input Validators

Responsibility:
- Validate user input
- Sanitize data
- Check constraints
"""

import re
from typing import Any, List
from app.utils.exceptions import InvalidInputError


class InputValidator:
    """
    Validate user input.
    """

    @staticmethod
    def validate_lab_name(name: str) -> None:
        """
        Validate lab name.

        Args:
            name: Lab name

        Raises:
            InvalidInputError if invalid
        """
        if not name or not isinstance(name, str):
            raise InvalidInputError("Lab name must be a non-empty string")

        if len(name) > 255:
            raise InvalidInputError("Lab name must be less than 255 characters")

        # Allow alphanumeric, spaces, hyphens, underscores
        if not re.match(r"^[a-zA-Z0-9\s_-]+$", name):
            raise InvalidInputError(
                "Lab name can only contain letters, numbers, spaces, hyphens, and underscores"
            )

    @staticmethod
    def validate_node_name(name: str) -> None:
        """
        Validate node name.

        Args:
            name: Node name

        Raises:
            InvalidInputError if invalid
        """
        if not name or not isinstance(name, str):
            raise InvalidInputError("Node name must be a non-empty string")

        if len(name) > 255:
            raise InvalidInputError("Node name must be less than 255 characters")

    @staticmethod
    def validate_positive_integer(value: Any, field_name: str = "value") -> int:
        """
        Validate positive integer.

        Args:
            value: Value to validate
            field_name: Field name for error message

        Returns:
            The validated integer

        Raises:
            InvalidInputError if invalid
        """
        try:
            int_value = int(value)
            if int_value <= 0:
                raise ValueError
            return int_value
        except (ValueError, TypeError):
            raise InvalidInputError(f"{field_name} must be a positive integer")

    @staticmethod
    def validate_email(email: str) -> None:
        """
        Validate email address.

        Args:
            email: Email address

        Raises:
            InvalidInputError if invalid
        """
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, email):
            raise InvalidInputError("Invalid email address")

    @staticmethod
    def validate_choice(value: str, choices: List[str], field_name: str = "value") -> None:
        """
        Validate value is in choices.

        Args:
            value: Value to validate
            choices: List of valid choices
            field_name: Field name for error message

        Raises:
            InvalidInputError if invalid
        """
        if value not in choices:
            raise InvalidInputError(
                f"{field_name} must be one of: {', '.join(choices)}"
            )

    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000) -> str:
        """
        Sanitize string input.

        Args:
            value: String to sanitize
            max_length: Maximum allowed length

        Returns:
            Sanitized string

        Raises:
            InvalidInputError if too long
        """
        if not isinstance(value, str):
            raise InvalidInputError("Expected string")

        value = value.strip()

        if len(value) > max_length:
            raise InvalidInputError(
                f"Input exceeds maximum length of {max_length} characters"
            )

        return value
