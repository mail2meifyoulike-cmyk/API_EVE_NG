# API EVE-NG - Complete Project Structure

## Overview

This document defines the proper project structure implementing a secure, scalable backend-for-frontend (BFF) architecture with clear separation of concerns.

## Directory Structure

```
API_EVE_NG/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app initialization
│   │   ├── database.py             # Database connection & session
│   │   ├── config.py               # Configuration management
│   │   │
│   │   ├── api/                    # API Routers (HTTP Endpoints)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Authentication endpoints
│   │   │   ├── labs.py             # Lab management endpoints
│   │   │   ├── nodes.py            # Node endpoints
│   │   │   ├── networks.py         # Network endpoints
│   │   │   ├── templates.py        # Template endpoints
│   │   │   ├── monitoring.py       # Monitoring endpoints
│   │   │   ├── deployments.py      # Deployment endpoints
│   │   │   └── system.py           # System status endpoints
│   │   │
│   │   ├── services/               # Business Logic & EVE-NG Integration
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   ├── eve/                # EVE-NG Services (communicate with EVE-NG)
│   │   │   │   ├── __init__.py
│   │   │   │   ├── client.py       # Base HTTP client for EVE-NG
│   │   │   │   ├── auth.py         # EVE-NG authentication service
│   │   │   │   ├── labs.py         # Lab operations service
│   │   │   │   ├── nodes.py        # Node operations service
│   │   │   │   ├── networks.py     # Network operations service
│   │   │   │   ├── templates.py    # Template management service
│   │   │   │   ├── images.py       # Image management service
│   │   │   │   ├── monitoring.py   # Monitoring/metrics service
│   │   │   │   └── consoles.py     # Console/VNC service
│   │   │   │
│   │   │   ├── auth_service.py     # JWT/Session token management
│   │   │   ├── cache_service.py    # Caching layer
│   │   │   └── audit_service.py    # Audit logging
│   │   │
│   │   ├── models/                 # SQLAlchemy ORM Models
│   │   │   ├── __init__.py
│   │   │   ├── lab.py              # Lab model
│   │   │   ├── deployment.py       # Deployment model
│   │   │   ├── user.py             # User model
│   │   │   ├── audit_log.py        # Audit log model
│   │   │   └── cache.py            # Cache model
│   │   │
│   │   ├── schemas/                # Pydantic Schemas (Request/Response)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Auth schemas
│   │   │   ├── labs.py             # Lab schemas
│   │   │   ├── nodes.py            # Node schemas
│   │   │   ├── networks.py         # Network schemas
│   │   │   ├── monitoring.py       # Monitoring schemas
│   │   │   └── common.py           # Common schemas
│   │   │
│   │   ├── middleware/             # Custom Middleware
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Authentication middleware
│   │   │   ├── error_handler.py    # Error handling
│   │   │   └── logging.py          # Request/response logging
│   │   │
│   │   ├── utils/                  # Utility Functions
│   │   │   ├── __init__.py
│   │   │   ├── exceptions.py       # Custom exceptions
│   │   │   ├── validators.py       # Input validators
│   │   │   └── helpers.py          # Helper functions
│   │   │
│   │   └── websocket/              # WebSocket Handlers (Future)
│   │       ├── __init__.py
│   │       ├── manager.py          # WebSocket manager
│   │       └── handlers.py         # WebSocket event handlers
│   │
│   ├── tests/                      # Unit & Integration Tests
│   │   ├── __init__.py
│   │   ├── conftest.py             # Pytest fixtures
│   │   ├── test_auth.py
│   │   ├── test_labs.py
│   │   └── services/
│   │       ├── test_eve_auth.py
│   │       └── test_eve_labs.py
│   │
│   ├── migrations/                 # Alembic Database Migrations
│   │   ├── versions/
│   │   └── env.py
│   │
│   ├── .env                        # Environment variables (gitignored)
│   ├── .env.example                # Example environment variables
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Docker configuration
│   └── main.py                     # Entry point
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   │
│   │   ├── api/                    # API Client Layer
│   │   │   ├── client.js           # Axios instance & interceptors
│   │   │   ├── auth.js             # Authentication API calls
│   │   │   ├── labs.js             # Lab API calls
│   │   │   ├── nodes.js            # Node API calls
│   │   │   ├── networks.js         # Network API calls
│   │   │   ├── monitoring.js       # Monitoring API calls
│   │   │   ├── deployments.js      # Deployment API calls
│   │   │   └── system.js           # System API calls
│   │   │
│   │   ├── hooks/                  # Custom React Hooks
│   │   │   ├── useAuth.js          # Authentication hook
│   │   │   ├── useLabs.js          # Labs hook (fetch, create, update)
│   │   │   ├── useNodes.js         # Nodes hook
│   │   │   ├── useNetworks.js      # Networks hook
│   │   │   ├── useMonitoring.js    # Monitoring/metrics hook
│   │   │   ├── useWebSocket.js     # WebSocket hook
│   │   │   └── useQuery.js         # Generic query hook
│   │   │
│   │   ├── context/                # React Context
│   │   │   ├── AuthContext.js      # Auth state
│   │   │   ├── LabsContext.js      # Labs state
│   │   │   └── NotificationContext.js # Notifications
│   │   │
│   │   ├── pages/                  # Page Components
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Labs/
│   │   │   │   ├── LabsList.js
│   │   │   │   ├── LabDetails.js
│   │   │   │   └── CreateLab.js
│   │   │   ├── Nodes/
│   │   │   ├── Networks/
│   │   │   ├── Monitoring/
│   │   │   └── Settings/
│   │   │
│   │   ├── components/             # Reusable Components
│   │   │   ├── Header.js
│   │   │   ├── Sidebar.js
│   │   │   ├── LabCard.js
│   │   │   ├── LabForm.js
│   │   │   ├── MonitoringChart.js
│   │   │   ├── ConsoleViewer.js
│   │   │   └── Loading.js
│   │   │
│   │   ├── websocket/              # WebSocket Client
│   │   │   ├── socketManager.js    # WebSocket manager
│   │   │   └── subscriptions.js    # Event subscriptions
│   │   │
│   │   ├── utils/                  # Utility Functions
│   │   │   ├── constants.js        # Constants
│   │   │   ├── validators.js       # Validators
│   │   │   └── formatters.js       # Data formatters
│   │   │
│   │   ├── App.js                  # Root component
│   │   ├── index.js                # Entry point
│   │   └── index.css               # Global styles
│   │
│   ├── .env                        # Frontend environment variables
│   ├── .env.example                # Example environment variables
│   ├── package.json
│   ├── Dockerfile
│   └── .gitignore
│
├── docker-compose.yml              # Docker Compose Configuration
├── .gitignore
├── ARCHITECTURE.md                 # Architecture documentation
├── PROJECT_STRUCTURE.md            # This file
├── DEVELOPMENT_GUIDE.md            # Development guidelines
├── API_ENDPOINTS.md                # API endpoint documentation
└── README.md
```

---

## Layer Responsibilities

### 1. Frontend Layer (`frontend/src/`)

**Responsibility**: User Interface & Presentation

- **api/**: HTTP client layer
  - Single axios instance pointing to backend
  - Request interceptors (auth tokens, headers)
  - Response interceptors (error handling)
  - No direct EVE-NG communication

- **hooks/**: Custom React Hooks
  - `useLabs()`: Fetch, create, update labs
  - `useMonitoring()`: Real-time metrics via WebSocket
  - `useAuth()`: Authentication state management
  - Encapsulates API logic reusable across components

- **context/**: Global State Management
  - Authentication state
  - User profile
  - Notifications
  - Theme/settings

- **pages/**: Page-level components
  - Dashboard
  - Labs management
  - Monitoring
  - Settings

- **components/**: Reusable UI components
  - Forms
  - Cards
  - Tables
  - Charts

### 2. Backend API Layer (`backend/app/api/`)

**Responsibility**: HTTP Endpoint Handling

- Receives requests from frontend
- Validates input (using Pydantic schemas)
- Calls appropriate service layer
- Returns formatted responses
- Handles HTTP status codes

Example: `labs.py`
```python
@router.get("/")
async def list_labs(current_user = Depends(get_current_user)):
    """GET /api/labs - List all labs"""
    # Validation done by FastAPI automatically
    labs = await labs_service.list_labs()
    return {"data": labs}
```

### 3. Backend Service Layer (`backend/app/services/`)

**Responsibility**: Business Logic & Integration

#### a. EVE-NG Services (`services/eve/`)
- Communicate with EVE-NG API
- Each service handles one resource type
- Manage EVE-NG authentication
- Parse EVE-NG responses
- Handle EVE-NG errors

Example: `eve/labs.py`
```python
class LabsService:
    def __init__(self, client: EVEngClient):
        self.client = client
    
    async def list_labs(self):
        """Call EVE-NG to list labs"""
        response = await self.client.get("/labs")
        return response["data"]
    
    async def start_lab(self, lab_id):
        """Call EVE-NG to start lab"""
        return await self.client.post(f"/labs/{lab_id}/start")
```

#### b. Application Services (`services/`)
- Authentication & session management
- Database operations
- Caching layer
- Audit logging
- Business logic combining EVE-NG + Database

Example: `auth_service.py`
```python
class AuthService:
    async def login(self, username, password):
        # 1. Authenticate with EVE-NG
        eve_auth = await eve_auth_service.login(username, password)
        
        # 2. Create session in database
        session = await create_session_in_db(username)
        
        # 3. Generate JWT token
        token = generate_jwt_token(session.id)
        
        return {"token": token, "user": username}
```

### 4. Backend Models & Schemas (`backend/app/models/`, `schemas/`)

**Models**: SQLAlchemy ORM
- Database table definitions
- Relationships
- Constraints

**Schemas**: Pydantic
- Request validation
- Response serialization
- Documentation

### 5. Database Layer

- PostgreSQL database
- Session management
- Transaction handling
- Audit trail logging

---

## Data Flow Examples

### Example 1: Fetch Labs

```
Frontend
  │
  ├─ useLabs.js hook calls
  │  api.labs.fetchLabs()
  │
  └─→ GET /api/labs
       ↓
       Backend
       │
       ├─ api/labs.py
       │  @router.get("/")
       │  async def list_labs(current_user):
       │
       ├─ Validates current_user (middleware)
       │
       ├─ Calls services.eve.labs.list_labs()
       │
       └─→ services/eve/labs.py
            │
            ├─ Calls client.get("/labs")
            │
            └─→ EVE-NG API (HTTPS)
                 ↓
                 Returns: {"data": [...labs...]}
       
       ← Backend processes response
       ← Applies business logic
       ← Returns to Frontend
       
Frontend
  │
  ├─ Receives response
  │
  └─ useLabs hook updates state
     Component re-renders
```

### Example 2: Start a Lab

```
Frontend (Labs page)
  │
  ├─ User clicks "Start Lab" button
  │
  ├─ Calls api.labs.startLab(labId)
  │
  └─→ POST /api/labs/{lab_id}/start
       ↓
       Backend
       │
       ├─ Validates user has permission
       │
       ├─ Logs audit event
       │
       ├─ Calls eve_labs_service.start_lab(lab_id)
       │
       └─→ services/eve/labs.py
            │
            ├─ Calls EVE-NG: POST /labs/{lab_id}/start
            │
            └─ Returns status
       
       ← Backend gets response
       ← Updates database (lab status)
       ← Logs success
       ← Returns to Frontend
       
Frontend
  │
  ├─ Receives response
  │
  ├─ useLabs hook updates state
  │
  └─ Component shows "Lab starting..."
     Polling /api/labs/{lab_id} for status updates
```

### Example 3: Create Lab

```
Frontend (CreateLab form)
  │
  ├─ User submits form
  │
  ├─ Form validation (client-side)
  │
  ├─ Calls api.labs.createLab(formData)
  │
  └─→ POST /api/labs
       Body: { name, description, topology }
       ↓
       Backend
       │
       ├─ api/labs.py schema validation
       │  (Pydantic validates input)
       │
       ├─ Calls eve_labs_service.create_lab(data)
       │
       └─→ services/eve/labs.py
            │
            ├─ Calls EVE-NG: POST /labs
            │
            ├─ EVE-NG creates lab
            │
            └─ Returns lab_id
       
       ← Backend receives lab_id
       ← Creates DB record for lab
       ← Logs audit event
       ← Returns full lab object
       
Frontend
  │
  ├─ Receives new lab data
  │
  ├─ useLabs hook adds to state
  │
  └─ Component redirects to lab details
     Shows success message
```

---

## Key Principles

### 1. **Single Responsibility**
- Each module has one reason to change
- API routers handle HTTP
- Services handle business logic
- EVE-NG services handle EVE-NG communication

### 2. **Dependency Injection**
- Services receive their dependencies
- Easier to test
- Easy to swap implementations

```python
# Instead of:
lab_service = LabsService()
lab_service.list_labs()

# Use:
lab_service = LabsService(eve_client, db_session, cache)
await lab_service.list_labs()
```

### 3. **Error Handling**
- Custom exceptions for different error types
- Middleware catches and formats errors
- Frontend receives consistent error responses

### 4. **Logging & Auditing**
- All operations logged
- Audit trail for compliance
- Debug logs for troubleshooting

### 5. **No Direct Frontend-to-EVE-NG Communication**
- ✅ Frontend → Backend (HTTP)
- ✅ Backend → EVE-NG (Internal, controlled)
- ❌ Frontend → EVE-NG (NEVER)

---

## Development Workflow

### Adding a New Feature

1. **Define the API endpoint** in `backend/app/api/`
   ```python
   @router.post("/labs/deploy")
   async def deploy_lab(lab_id: int, current_user = Depends(get_current_user)):
       return await deploy_service.deploy(lab_id)
   ```

2. **Implement the service** in `backend/app/services/`
   ```python
   class DeployService:
       async def deploy(self, lab_id):
           eve_response = await eve_deploy_service.deploy(lab_id)
           return eve_response
   ```

3. **Implement EVE-NG service** in `backend/app/services/eve/`
   ```python
   class DeployService:
       async def deploy(self, lab_id):
           return await self.client.post(f"/labs/{lab_id}/deploy")
   ```

4. **Create API client method** in `frontend/src/api/`
   ```javascript
   export const deployLab = async (labId) => {
       const response = await api.post(`/labs/${labId}/deploy`);
       return response.data;
   };
   ```

5. **Create React hook** in `frontend/src/hooks/`
   ```javascript
   export const useDeploy = () => {
       const [loading, setLoading] = useState(false);
       const deploy = async (labId) => {
           setLoading(true);
           try {
               return await deployLab(labId);
           } finally {
               setLoading(false);
           }
       };
       return { deploy, loading };
   };
   ```

6. **Use in React component**
   ```javascript
   const MyComponent = () => {
       const { deploy, loading } = useDeploy();
       return (
           <button onClick={() => deploy(labId)} disabled={loading}>
               {loading ? 'Deploying...' : 'Deploy'}
           </button>
       );
   };
   ```

---

## Technology Stack

### Backend
- **FastAPI**: Modern async web framework
- **Uvicorn**: ASGI server
- **SQLAlchemy**: ORM
- **PostgreSQL**: Database
- **Pydantic**: Data validation
- **Pytest**: Testing

### Frontend
- **React**: UI library
- **Axios**: HTTP client
- **React Query**: Data fetching
- **React Context**: State management
- **WebSocket**: Real-time updates

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration

---

## Security Considerations

1. **Authentication**: JWT tokens in cookies (HTTP-only)
2. **Authorization**: Role-based access control (RBAC)
3. **Input Validation**: Pydantic schemas
4. **CORS**: Backend whitelist
5. **HTTPS**: TLS encryption
6. **Secrets**: Environment variables (never in code)
7. **Audit Logging**: All operations logged
8. **Rate Limiting**: Prevent abuse

---

## Testing Strategy

### Unit Tests
- Test individual functions/methods
- Mock EVE-NG responses
- Mock database

### Integration Tests
- Test API endpoints
- Test with actual database
- Mock EVE-NG only

### End-to-End Tests
- Test complete workflows
- Frontend → Backend → EVE-NG
- Real test environment

---

## Performance Optimization

1. **Caching**: Cache EVE-NG responses
2. **Pagination**: Handle large datasets
3. **Async/Await**: Non-blocking I/O
4. **Connection Pooling**: Reuse DB connections
5. **CDN**: Cache static frontend assets
6. **Database Indexes**: Speed up queries

---

## Monitoring & Logging

- **Application Logs**: Track operations
- **Audit Logs**: Track who did what
- **Performance Metrics**: Response times
- **Error Tracking**: Sentry/similar
- **Health Checks**: Endpoint availability

---

This structure provides:
- ✅ Clear separation of concerns
- ✅ Easy to test
- ✅ Easy to maintain
- ✅ Scalable
- ✅ Secure
- ✅ Professional
