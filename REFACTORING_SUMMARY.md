# Architecture Refactoring Summary

## Problem Identified

**Issue #1: Frontend Bypasses Backend**

The frontend was making direct calls to EVE-NG API, completely bypassing the backend:

```javascript
// ❌ WRONG - frontend/src/services/api.js
const eveNgApi = axios.create({
  baseURL: 'https://evengvlab.ddns.net:443/api',
  withCredentials: true,
});

// Hundreds of direct calls
await eveNgApi.get('/labs')
await eveNgApi.post('/auth/login')
```

**Consequences:**
- ❌ No authentication/authorization on backend
- ❌ No audit trail or logging
- ❌ No rate limiting or access control
- ❌ EVE-NG credentials exposed in frontend code
- ❌ CORS configuration required on EVE-NG
- ❌ Impossible to add business logic layer
- ❌ Security vulnerability

---

## Solution Implemented

### Architecture: Backend-for-Frontend (BFF) Pattern

```
Frontend (React)        Backend (FastAPI)        EVE-NG API
    |                        |                        |
    | HTTP Request           |                        |
    |----> /api/labs ------->|                        |
    |                        | HTTPS (Internal)       |
    |                        |----> /api/labs ------->|
    |                        |                    (Secure)
    |                        |<---- Response --------|
    |<---- Response ---------|                        |
    |                        |                        |
```

**Key Principle**: Frontend ONLY talks to backend. Backend talks to EVE-NG.

---

## Changes Made

### 1. Fixed Frontend API Service
**File**: `frontend/src/services/api.js`

✅ **Before**: 2 Axios clients (direct EVE-NG + backend)
✅ **After**: 1 Axios client (backend only)

```javascript
// ✅ CORRECT - Single backend client
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Session cookies
});

// All calls through backend
export const fetchLabs = async () => {
  const response = await api.get('/api/labs'); // ✅ Backend proxy
  return response.data;
};
```

### 2. Created Backend Authentication Router
**File**: `backend/app/routers/auth.py`

✅ New endpoints:
- `POST /api/auth/login` - Frontend sends credentials, backend handles EVE-NG auth
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/status` - Check auth status

✅ Secure session management:
- HTTP-only cookies (XSS protection)
- SameSite=strict (CSRF protection)
- Backend handles all EVE-NG communication

```python
@router.post("/login")
async def login(request: LoginRequest):
    # 1. Frontend sends credentials to backend
    # 2. Backend calls EVE-NG /auth/login
    # 3. Backend stores session in HTTP-only cookie
    # 4. Backend returns success to frontend
    # ✅ Frontend never sees EVE-NG credentials
```

### 3. Comprehensive Documentation

#### ARCHITECTURE.md
- ✅ Architecture diagram
- ✅ API flow examples (correct vs incorrect)
- ✅ Backend implementation patterns
- ✅ Frontend implementation patterns
- ✅ Environment variable configuration
- ✅ Migration checklist

#### PROJECT_STRUCTURE.md
- ✅ Recommended directory structure (backend & frontend)
- ✅ Layer responsibilities
- ✅ Data flow examples (3 scenarios)
- ✅ Key principles (SRP, DI, error handling)
- ✅ Technology stack
- ✅ Development workflow

#### DEVELOPMENT_GUIDE.md
- ✅ Local setup instructions
- ✅ Adding backend services (with console example)
- ✅ Adding API endpoints
- ✅ Adding frontend hooks
- ✅ Testing strategies
- ✅ Debugging guide
- ✅ Common tasks

#### API_ENDPOINTS.md
- ✅ 20+ endpoints documented
- ✅ Request/response examples
- ✅ Error codes
- ✅ Rate limiting
- ✅ cURL examples
- ✅ Postman guide
- ✅ OpenAPI links

---

## Benefits of New Architecture

| Aspect | Before | After |
|--------|--------|-------|
| **Security** | EVE-NG creds in frontend | Creds backend only (env vars) |
| **Authentication** | None on backend | Full auth middleware |
| **Audit Trail** | No logging | Complete logging |
| **Rate Limiting** | Not possible | Easy to add |
| **CORS** | Configure on EVE-NG | Handle in backend |
| **Error Handling** | Inconsistent | Centralized |
| **Business Logic** | Impossible | Backend service layer |
| **Caching** | Not possible | Easy to add |
| **Testing** | Difficult | Mock backend |
| **Maintenance** | Hard to modify | Easy to extend |

---

## Project Structure Refactoring

### Recommended Backend Structure

```
backend/app/
├── api/                 # HTTP Endpoints
│   ├── auth.py         # Authentication
│   ├── labs.py         # Lab management
│   ├── nodes.py        # Node management
│   ├── networks.py     # Network management
│   └── ...
│
├── services/           # Business Logic
│   ├── eve/            # EVE-NG Integration
│   │   ├── client.py   # HTTP client
│   │   ├── auth.py     # Auth service
│   │   ├── labs.py     # Labs service
│   │   ├── nodes.py    # Nodes service
│   │   └── ...
│   ├── auth_service.py  # JWT/Session management
│   ├── cache_service.py # Caching layer
│   └── audit_service.py # Audit logging
│
├── models/             # Database Models
├── schemas/            # Pydantic Schemas
├── middleware/         # Custom Middleware
└── utils/              # Utilities
```

### Recommended Frontend Structure

```
frontend/src/
├── api/                # HTTP Clients
│   ├── client.js       # Axios instance
│   ├── auth.js         # Auth calls
│   ├── labs.js         # Lab calls
│   └── ...
│
├── hooks/              # Custom Hooks
│   ├── useAuth.js      # Auth hook
│   ├── useLabs.js      # Labs hook
│   └── ...
│
├── context/            # State Management
├── pages/              # Page Components
│   ├── Auth.js
│   ├── Labs.js
│   └── ...
│
└── components/         # Reusable Components
    ├── LabList.js
    ├── LabForm.js
    └── ...
```

---

## Network Configuration

### Updated Server Configuration

**Application Server**: 192.168.3.21
- Frontend: Port 3000
- Backend API: Port 8000

**EVE-NG Server**: evengvlab.ddns.net
- API: Port 443 (HTTPS)
- Protocol: HTTPS only

**Backend** connects to EVE-NG via:
```
https://evengvlab.ddns.net:443/api/
```

---

## Migration Checklist

- [ ] Review architecture documentation
- [ ] Update `.env` files with new server IPs/FQDNs
- [ ] Configure firewall rules for new network
- [ ] Test backend to EVE-NG connectivity
- [ ] Deploy updated backend code
- [ ] Deploy updated frontend code
- [ ] Run integration tests
- [ ] Monitor logs for errors
- [ ] Verify all features working

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2024-01-21 | BFF Architecture Implementation |
| 1.9.0 | 2024-01-20 | Updated IP and FQDN configurations |

---

**Status**: ✅ Complete
**Last Updated**: 2026-07-21
