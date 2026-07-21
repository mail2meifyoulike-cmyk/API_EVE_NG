"""
Helper Functions

Responsibility:
- Utility functions
- Data transformation
- Common operations
"""

from typing import Dict, Any, List
from datetime import datetime


def paginate(items: List[Any], skip: int = 0, limit: int = 100) -> List[Any]:
    """
    Paginate list of items.

    Args:
        items: List to paginate
        skip: Number of items to skip
        limit: Maximum items to return

    Returns:
        Paginated items
    """
    return items[skip : skip + limit]


def format_datetime(dt: datetime) -> str:
    """
    Format datetime to ISO string.

    Args:
        dt: Datetime object

    Returns:
        ISO formatted string
    """
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)


def merge_dicts(dict1: Dict, dict2: Dict) -> Dict:
    """
    Merge two dictionaries.

    Args:
        dict1: First dictionary
        dict2: Second dictionary

    Returns:
        Merged dictionary
    """
    result = dict1.copy()
    result.update(dict2)
    return result


def filter_dict(data: Dict, keys: List[str]) -> Dict:
    """
    Filter dictionary to only include specified keys.

    Args:
        data: Dictionary to filter
        keys: Keys to keep

    Returns:
        Filtered dictionary
    """
    return {k: v for k, v in data.items() if k in keys}


def is_valid_lab_state_transition(current_state: str, target_state: str) -> bool:
    """
    Check if lab state transition is valid.

    Args:
        current_state: Current lab state
        target_state: Target lab state

    Returns:
        True if transition is valid

    Valid transitions:
        pending -> provisioning
        provisioning -> running
        running -> stopped
        stopped -> running
        * -> failed
    """
    valid_transitions = {
        "pending": ["provisioning", "failed"],
        "provisioning": ["running", "failed"],
        "running": ["stopped", "failed"],
        "stopped": ["running", "failed"],
        "failed": ["pending"],
    }

    return target_state in valid_transitions.get(current_state, [])
