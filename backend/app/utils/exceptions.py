"""
Custom Exceptions for API_EVE_NG

Responsibility:
- Define custom exception types
- Provide meaningful error messages
- Support error serialization
"""


class EVELabException(Exception):
    """
    Base exception for all EVE-NG related errors.
    """

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class EVEngConnectionError(EVELabException):
    """
    Raised when unable to connect to EVE-NG server.
    """

    def __init__(self, message: str = "Unable to connect to EVE-NG server"):
        super().__init__(message, status_code=503)


class EVEngAuthenticationError(EVELabException):
    """
    Raised when authentication with EVE-NG fails.
    """

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)


class EVEngAuthorizationError(EVELabException):
    """
    Raised when user lacks permission for operation.
    """

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, status_code=403)


class LabNotFoundError(EVELabException):
    """
    Raised when lab is not found.
    """

    def __init__(self, lab_id: str = ""):
        message = f"Lab not found: {lab_id}" if lab_id else "Lab not found"
        super().__init__(message, status_code=404)


class NodeNotFoundError(EVELabException):
    """
    Raised when node is not found.
    """

    def __init__(self, node_id: str = ""):
        message = f"Node not found: {node_id}" if node_id else "Node not found"
        super().__init__(message, status_code=404)


class InvalidInputError(EVELabException):
    """
    Raised when input validation fails.
    """

    def __init__(self, message: str = "Invalid input"):
        super().__init__(message, status_code=400)


class LabAlreadyExistsError(EVELabException):
    """
    Raised when trying to create lab that already exists.
    """

    def __init__(self, lab_name: str = ""):
        message = (
            f"Lab already exists: {lab_name}"
            if lab_name
            else "Lab already exists"
        )
        super().__init__(message, status_code=409)


class LabInUseError(EVELabException):
    """
    Raised when trying to delete/modify lab that is in use.
    """

    def __init__(self, lab_id: str = ""):
        message = f"Lab is in use: {lab_id}" if lab_id else "Lab is in use"
        super().__init__(message, status_code=409)


class InvalidOperationError(EVELabException):
    """
    Raised when operation is invalid for current state.
    """

    def __init__(self, message: str = "Invalid operation"):
        super().__init__(message, status_code=400)
