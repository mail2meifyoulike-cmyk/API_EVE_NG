# API EVE-NG Architecture Design

## Overview

This document describes the correct three-tier architecture for the API EVE-NG system.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                      (:3000 in docker)                          │
│  - React Components & State Management                          │
│  - Uses: frontend/src/services/api.js                          │
│  - Environment: REACT_APP_API_URL=http://backend:8000/api      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTP/HTTPS
                           │ /api/* (ONLY THIS)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│                    (:8000 in docker)                            │
│  - Authentication & Authorization                               │
│  - Request Validation & Logging                                 │
│  - Database Layer (PostgreSQL)                                  │
│  - EVE-NG Proxy (routes requests to EVE-NG)                     │
│  - Rate Limiting & CORS                                         │
└───────────────┬──────────────────────────────────┬──────────────┘
                │                                  │
                │ Database API                     │ HTTP/HTTPS (Secure)
                │                                  │ Direct EVE-NG API Calls
                ▼                                  ▼
         ┌──────────────┐              ┌──────────────────────┐
         │  PostgreSQL  │              │  EVE-NG API Server   │
         │   (:5432)    │              │  (:8443)             │
         └──────────────┘              └──────────────────────┘
```

## Architecture Principles

### 1. **Single Entry Point**
- Frontend communicates ONLY with the backend API (`http://backend:8000/api`)
- Frontend NEVER makes direct calls to EVE-NG
- All cross-origin requests (CORS) are handled at the backend

### 2. **Backend as Proxy & Gateway**
The backend acts as:
- **Proxy**: Routes requests to EVE-NG
- **Gateway**: Adds authentication, validation, logging
- **Service Layer**: Applies business logic
- **Database**: Maintains audit trails and state

### 3. **Security**
- EVE-NG credentials stored only on backend (environment variables)
- Frontend never sees EVE-NG URLs or credentials
- All requests pass through backend authorization middleware
- Audit logging for compliance

### 4. **Separation of Concerns**
- **Frontend**: UI/UX, state management, user interaction
- **Backend**: Security, validation, data persistence, integrations
- **EVE-NG**: Lab management (controlled exclusively via backend)

## API Flow Examples

### Example 1: Fetch Labs

**CORRECT FLOW:**
```
1. Frontend calls: GET /api/labs (via axios/backend)
2. Backend receives request
3. Backend checks user authentication/authorization
4. Backend calls EVE-NG: GET https://evengvlab4you.ddns.net:8443/api/labs
5. Backend receives response from EVE-NG
6. Backend processes/filters data (applies business logic)
7. Backend returns response to frontend
8. Frontend displays data to user
```

**INCORRECT FLOW (CURRENT - BYPASSES BACKEND):**
```
1. Frontend calls directly: GET https://evengvlab4you.ddns.net:8443/api/labs
2. CORS issues, security issues, no audit trail
3. No backend validation or authorization
4. Credentials exposed in frontend code
```

### Example 2: Login to EVE-NG

**CORRECT FLOW:**
```
1. Frontend calls: POST /api/auth/login with username/password
2. Backend receives request
3. Backend validates request format
4. Backend calls EVE-NG: POST /auth/login
5. EVE-NG returns authentication token (stored as HTTP-only cookie)
6. Backend creates session in database
7. Backend returns session info to frontend
8. Frontend stores session token (non-HTTP-only cookie for CSRF protection)
9. Subsequent requests include session token
10. Backend validates token, uses it to make EVE-NG calls
```

**NEVER:**
- Store EVE-NG tokens in frontend localStorage
- Make direct EVE-NG API calls from frontend
- Expose EVE-NG URLs in frontend environment variables

## Backend Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/login` - Authenticate user with EVE-NG
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/status` - Check authentication status

### Labs (`/api/labs`)
- `GET /api/labs` - List all labs (fetches from EVE-NG, stores in DB)
- `GET /api/labs/{lab_id}` - Get lab details
- `POST /api/labs` - Create lab
- `PUT /api/labs/{lab_id}` - Update lab
- `DELETE /api/labs/{lab_id}` - Delete lab
- `POST /api/labs/{lab_id}/start` - Start lab
- `POST /api/labs/{lab_id}/stop` - Stop lab

### System Status (`/api/status`)
- `GET /api/status` - System health and metrics
- `GET /api/status/cluster` - Cluster information

### Templates (`/api/templates`)
- `GET /api/templates` - List templates
- `POST /api/templates/upload` - Upload template

### Users (`/api/users`)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Delete user

## Backend Implementation Pattern

```python
# backend/app/routers/labs.py

from fastapi import APIRouter, Depends, HTTPException
from app import client  # Global EVE-NG client
from app.auth import get_current_user  # Auth middleware

router = APIRouter()

@router.get("/")
async def list_labs(current_user = Depends(get_current_user)):
    """List all labs from EVE-NG"""
    # Step 1: Authenticate user
    # ✓ current_user is validated by dependency
    
    # Step 2: Get EVE-NG client
    eve_ng = client.get_eve_ng_client()
    if not eve_ng:
        raise HTTPException(status_code=503, detail="EVE-NG not connected")
    
    # Step 3: Call EVE-NG through backend
    try:
        labs = eve_ng.list_labs()  # Internal method, not exposed to frontend
        
        # Step 4: Process/filter based on user role
        filtered_labs = [lab for lab in labs if user_can_access(current_user, lab)]
        
        # Step 5: Log audit trail
        audit_log(current_user, "list_labs", success=True)
        
        # Step 6: Return to frontend
        return {"data": filtered_labs}
    
    except Exception as e:
        audit_log(current_user, "list_labs", success=False, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch labs")
```

## Frontend Implementation Pattern

```javascript
// frontend/src/services/api.js

import axios from 'axios';

// ONLY ONE BACKEND CLIENT
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,  // http://backend:8000
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Include cookies (session)
});

// Authentication
export const loginUser = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;  // Contains session token
};

export const logoutUser = async () => {
  await api.post('/auth/logout');
};

// Labs - ALL THROUGH BACKEND
export const fetchLabs = async () => {
  const response = await api.get('/labs');  // ✓ Backend, not EVE-NG
  return response.data;
};

export const startLab = async (labId) => {
  const response = await api.post(`/labs/${labId}/start`);
  return response.data;
};

// DO NOT:
// - Import EVE-NG URLs
// - Create separate EVE-NG axios client
// - Call EVE-NG directly
// - Store EVE-NG credentials
```

## Environment Variables

### Backend (.env)
```
# EVE-NG Configuration (BACKEND ONLY)
EVE_NG_FQDN=evengvlab4you.ddns.net
EVE_NG_PORT=8443
EVE_NG_PROTOCOL=https
EVE_NG_USERNAME=admin
EVE_NG_PASSWORD=eve_password
EVE_NG_VERIFY_SSL=false

# Database
DATABASE_URL=postgresql://eve_user:eve_password@db:5432/eve_db

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://frontend:3000"]
```

### Frontend (.env)
```
# ONLY Backend URL
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_BASE_URL=/api

# REMOVE THESE:
# - REACT_APP_EVE_NG_IP
# - REACT_APP_EVE_NG_FQDN
# - REACT_APP_EVE_NG_PORT
# - REACT_APP_EVE_NG_PROTOCOL
```

## Benefits of This Architecture

| Aspect | Benefit |
|--------|----------|
| **Security** | EVE-NG credentials never leave backend; frontend can't bypass auth |
| **Auditability** | All operations logged on backend for compliance |
| **Scalability** | Easy to add caching, rate limiting, load balancing on backend |
| **Maintenance** | EVE-NG API changes only affect backend |
| **Testing** | Backend can mock EVE-NG for unit tests |
| **Monitoring** | Centralized logging and metrics on backend |
| **CORS** | No CORS issues; backend handles cross-origin internally |
| **Performance** | Backend can cache responses, batch requests |

## Migration Checklist

- [ ] Remove `eveNgApi` client from `frontend/src/services/api.js`
- [ ] Update all frontend API calls to use `api` client
- [ ] Remove EVE-NG environment variables from frontend
- [ ] Add authentication middleware to backend
- [ ] Create backend proxy endpoints for all EVE-NG operations
- [ ] Add audit logging to all backend endpoints
- [ ] Test all endpoints through backend
- [ ] Remove direct EVE-NG credentials from frontend localStorage
- [ ] Update docker-compose.yml to remove EVE-NG URLs from frontend
- [ ] Update documentation

## References

- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)
- [Backend for Frontend (BFF)](https://samnewman.io/patterns/architectural/bff/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
