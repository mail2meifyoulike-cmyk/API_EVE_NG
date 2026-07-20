"""
Shared client state module to avoid circular imports.
Provides a centralized location for the global EVE-NG client instance.
"""

eve_ng_client = None


def get_eve_ng_client():
    """Get the current EVE-NG client instance"""
    return eve_ng_client


def set_eve_ng_client(client):
    """Set the EVE-NG client instance"""
    global eve_ng_client
    eve_ng_client = client
