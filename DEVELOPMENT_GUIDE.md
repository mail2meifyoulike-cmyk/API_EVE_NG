# Development Guide

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.9+
- Node.js 16+
- Git

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/afsm08-boop/API_EVE_NG.git
cd API_EVE_NG

# Start development environment
docker-compose up -d

# Create backend database
docker-compose exec backend alembic upgrade head

# Access services
# Backend: http://localhost:8000
# Backend Docs: http://localhost:8000/docs
# Frontend: http://localhost:3000
```

## Backend Development

### Adding a New Service (EVE-NG Integration)

**File**: `backend/app/services/eve/consoles.py`

```python
"""
Console Service - Manage VNC/Console access to nodes
"""

from app.services.eve.client import EVEngClient
from typing import Optional, Dict, Any


class ConsolesService:
    """Handle VNC/Console operations in EVE-NG"""
    
    def __init__(self, client: EVEngClient):
        self.client = client
    
    async def get_console_url(self, lab_id: int, node_id: int) -> Dict[str, Any]:
        """
        Get VNC console URL for a node
        
        Args:
            lab_id: Lab ID
            node_id: Node ID
        
        Returns:
            {"url": "vnc://...", "port": 5900, ...}
        """
        endpoint = f"/labs/{lab_id}/nodes/{node_id}/console"
        response = await self.client.get(endpoint)
        return response.get("data", {})
    
    async def open_telnet_console(self, lab_id: int, node_id: int) -> Dict[str, Any]:
        """
        Open telnet console for a node
        """
        endpoint = f"/labs/{lab_id}/nodes/{node_id}/telnet"
        return await self.client.post(endpoint)
```

### Adding a New API Endpoint

**File**: `backend/app/api/consoles.py`

```python
"""
Console API - Expose console operations to frontend
"""

from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.services.eve.consoles import ConsolesService
from app import client as eve_client
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/labs/{lab_id}/nodes/{node_id}/console")
async def get_console_url(
    lab_id: int,
    node_id: int,
    current_user = Depends(get_current_user)
):
    """
    Get VNC console URL for a node
    
    Endpoint: GET /api/consoles/labs/{lab_id}/nodes/{node_id}/console
    
    Authentication: Required (via JWT cookie)
    
    Returns:
        {
            "url": "vnc://localhost:5900",
            "port": 5900,
            "protocol": "vnc"
        }
    
    Error Cases:
        - 401: Not authenticated
        - 403: Not authorized
        - 404: Lab or node not found
        - 503: EVE-NG not available
    """
    try:
        eve_ng = eve_client.get_eve_ng_client()
        if not eve_ng:
            raise HTTPException(status_code=503, detail="EVE-NG not available")
        
        # Create service
        consoles_service = ConsolesService(eve_ng)
        
        # Get console URL
        console_data = await consoles_service.get_console_url(lab_id, node_id)
        
        # Log audit
        logger.info(f"User {current_user} opened console for lab {lab_id} node {node_id}")
        
        return console_data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Console error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get console URL")
```

### Adding Schema Validation

**File**: `backend/app/schemas/consoles.py`

```python
from pydantic import BaseModel, Field
from typing import Optional


class ConsoleURLResponse(BaseModel):
    """Console URL response"""
    url: str = Field(..., description="VNC URL")
    port: int = Field(..., description="Console port")
    protocol: str = Field(default="vnc", description="Protocol type")
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "vnc://localhost:5900",
                "port": 5900,
                "protocol": "vnc"
            }
        }
```

## Frontend Development

### Adding API Client

**File**: `frontend/src/api/consoles.js`

```javascript
/**
 * Console API Client
 * Handles VNC/telnet console operations
 */

import api from './client';

/**
 * Get VNC console URL for a node
 * @param {number} labId - Lab ID
 * @param {number} nodeId - Node ID
 * @returns {Promise<Object>} Console URL data
 * 
 * Example:
 *   const console = await getConsoleUrl(1, 5);
 *   // {url: "vnc://...", port: 5900}
 */
export const getConsoleUrl = async (labId, nodeId) => {
  try {
    const response = await api.get(`/api/consoles/labs/${labId}/nodes/${nodeId}/console`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get console for node ${nodeId}:`, error);
    throw error;
  }
};

/**
 * Open telnet console for a node
 * @param {number} labId - Lab ID
 * @param {number} nodeId - Node ID
 * @returns {Promise<Object>} Telnet connection data
 */
export const openTelnetConsole = async (labId, nodeId) => {
  try {
    const response = await api.post(`/api/consoles/labs/${labId}/nodes/${nodeId}/telnet`);
    return response.data;
  } catch (error) {
    console.error(`Failed to open telnet for node ${nodeId}:`, error);
    throw error;
  }
};
```

### Adding Custom Hook

**File**: `frontend/src/hooks/useConsole.js`

```javascript
/**
 * useConsole Hook
 * Manages console state and operations
 */

import { useState, useCallback } from 'react';
import * as consoleApi from '../api/consoles';

/**
 * Hook for managing console operations
 * 
 * Usage:
 *   const { console, loading, error, getConsole } = useConsole();
 *   
 *   useEffect(() => {
 *     getConsole(labId, nodeId);
 *   }, [labId, nodeId, getConsole]);
 */
export const useConsole = () => {
  const [console, setConsole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getConsole = useCallback(async (labId, nodeId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await consoleApi.getConsoleUrl(labId, nodeId);
      setConsole(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const openTelnet = useCallback(async (labId, nodeId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await consoleApi.openTelnetConsole(labId, nodeId);
      setConsole(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    console,
    loading,
    error,
    getConsole,
    openTelnet,
  };
};
```

### Using Hook in Component

**File**: `frontend/src/components/ConsoleViewer.js`

```javascript
import React, { useEffect } from 'react';
import { useConsole } from '../hooks/useConsole';

const ConsoleViewer = ({ labId, nodeId, nodeLabel }) => {
  const { console, loading, error, getConsole, openTelnet } = useConsole();

  useEffect(() => {
    getConsole(labId, nodeId);
  }, [labId, nodeId, getConsole]);

  if (loading) return <div>Loading console...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!console) return <div>No console available</div>;

  return (
    <div className="console-viewer">
      <h3>Console: {nodeLabel}</h3>
      <div className="console-controls">
        <a href={console.url} target="_blank" rel="noopener noreferrer">
          Open VNC Console
        </a>
        <button onClick={() => openTelnet(labId, nodeId)}>
          Open Telnet
        </button>
      </div>
      <div className="console-info">
        <p>Port: {console.port}</p>
        <p>Protocol: {console.protocol}</p>
      </div>
    </div>
  );
};

export default ConsoleViewer;
```

## Testing

### Backend Unit Test

**File**: `backend/tests/services/test_eve_consoles.py`

```python
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.eve.consoles import ConsolesService


@pytest.mark.asyncio
async def test_get_console_url():
    # Mock EVE-NG client
    mock_client = AsyncMock()
    mock_client.get.return_value = {
        "data": {
            "url": "vnc://localhost:5900",
            "port": 5900
        }
    }
    
    # Create service
    service = ConsolesService(mock_client)
    
    # Call method
    result = await service.get_console_url(lab_id=1, node_id=5)
    
    # Assert
    assert result["url"] == "vnc://localhost:5900"
    assert result["port"] == 5900
    mock_client.get.assert_called_once_with("/labs/1/nodes/5/console")
```

### Backend API Test

**File**: `backend/tests/api/test_consoles.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


@pytest.fixture
def auth_headers():
    """Get authentication headers"""
    return {"Authorization": "Bearer test-token"}


def test_get_console_url(auth_headers, monkeypatch):
    # Mock EVE-NG service
    mock_service = MagicMock()
    mock_service.get_console_url.return_value = {
        "url": "vnc://localhost:5900",
        "port": 5900
    }
    
    # Patch service
    monkeypatch.setattr(
        "app.api.consoles.ConsolesService",
        lambda *args: mock_service
    )
    
    # Call endpoint
    response = client.get(
        "/api/consoles/labs/1/nodes/5/console",
        headers=auth_headers
    )
    
    # Assert
    assert response.status_code == 200
    assert response.json()["url"] == "vnc://localhost:5900"
```

### Frontend Hook Test

**File**: `frontend/src/hooks/__tests__/useConsole.test.js`

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useConsole } from '../useConsole';
import * as consoleApi from '../../api/consoles';

jest.mock('../../api/consoles');

describe('useConsole', () => {
  it('should fetch console data', async () => {
    const mockConsoleData = {
      url: 'vnc://localhost:5900',
      port: 5900
    };
    
    consoleApi.getConsoleUrl.mockResolvedValue(mockConsoleData);
    
    const { result } = renderHook(() => useConsole());
    
    await act(async () => {
      await result.current.getConsole(1, 5);
    });
    
    expect(result.current.console).toEqual(mockConsoleData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
```

## Debugging

### Backend Debugging

```bash
# View backend logs
docker-compose logs -f backend

# Access backend shell
docker-compose exec backend bash

# Run backend with debugger
docker-compose exec backend python -m pdb app/main.py

# Access FastAPI docs
open http://localhost:8000/docs
```

### Frontend Debugging

```bash
# View frontend logs
docker-compose logs -f frontend

# Open browser dev tools
# - Chrome: F12
# - Firefox: F12
# - Safari: Cmd+Option+I

# React DevTools browser extension
# - Search in Chrome/Firefox web store
```

## Common Tasks

### Add a New Database Model

1. Create model in `backend/app/models/`
2. Create schema in `backend/app/schemas/`
3. Create migration: `docker-compose exec backend alembic revision --autogenerate -m "Add new model"`
4. Apply migration: `docker-compose exec backend alembic upgrade head`

### Add Logging

```python
import logging

logger = logging.getLogger(__name__)

# Different levels
logger.debug("Debug message")
logger.info("Info message")
logger.warning("Warning message")
logger.error("Error message")
logger.critical("Critical error")
```

### Add Error Handling

```python
from app.utils.exceptions import (
    EVEngConnectionError,
    EVEngAuthenticationError,
    LabNotFoundError
)

try:
    # Do something
    pass
except EVEngConnectionError as e:
    logger.error(f"EVE-NG connection failed: {e}")
    raise HTTPException(status_code=503, detail="EVE-NG not available")
except LabNotFoundError as e:
    logger.warning(f"Lab not found: {e}")
    raise HTTPException(status_code=404, detail="Lab not found")
```

## Code Style

### Backend (Python)

```bash
# Format code
docker-compose exec backend black app/

# Sort imports
docker-compose exec backend isort app/

# Lint
docker-compose exec backend flake8 app/
```

### Frontend (JavaScript)

```bash
# Format code
cd frontend && npm run format

# Lint
cd frontend && npm run lint
```

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for production deployment instructions.
