# Phase 3: Frontend Refactoring - Complete Implementation Guide

## Overview

Phase 3 focuses on restructuring the frontend to follow modern React best practices:
- Organized API clients by resource
- Custom hooks for business logic
- Context API for global state management
- Protected routes and authentication flow
- Error handling and loading states

## Architecture

```
frontend/src/
├── api/                    # HTTP Clients (organized by resource)
│   ├── client.js          # Base axios instance with interceptors
│   ├── auth.js            # Authentication endpoints
│   ├── labs.js            # Lab management endpoints
│   ├── nodes.js           # Node management endpoints
│   └── networks.js        # Network management endpoints
│
├── hooks/                  # Custom React hooks
│   ├── useAuth.js         # Authentication logic
│   ├── useLabs.js         # Labs CRUD operations
│   └── useNodes.js        # Nodes CRUD operations
│
├── context/               # React Context API
│   ├── AuthContext.js     # Auth state management
│   └── LabsContext.js     # Labs state management
│
├── pages/                 # Page components
│   ├── LoginPage.js       # Login page
│   ├── DashboardPage.js   # Dashboard
│   └── LabsPage.js        # Labs listing and management
│
├── components/            # Reusable components
│   ├── ProtectedRoute.js  # Route protection
│   └── ...
│
└── App.js                 # Main app with routing
```

## Key Features

### 1. API Client Organization

**Base Client** (`api/client.js`):
- Centralized Axios configuration
- Request interceptor for JWT token injection
- Response interceptor for error handling (401 redirects to login)
- Environment-based API URL configuration

**Resource-Based Clients**:
- `api/auth.js` - Login, logout, refresh, get current user
- `api/labs.js` - CRUD operations for labs, start/stop actions
- `api/nodes.js` - CRUD operations for nodes within labs
- `api/networks.js` - CRUD operations for networks

### 2. Custom Hooks

**useAuth Hook**:
```javascript
const { user, loading, error, login, logout } = useAuth();
```
- Manages authentication state
- Persists tokens to localStorage
- Auto-initializes user on app load
- Handles login/logout operations

**useLabs Hook**:
```javascript
const {
  labs,
  currentLab,
  loading,
  error,
  fetchLabs,
  fetchLabById,
  createLab,
  updateLab,
  deleteLab,
  startLab,
  stopLab,
} = useLabs();
```
- Manages labs data and state
- Handles all CRUD operations
- Auto-fetches labs on mount
- Manages loading and error states

**useNodes Hook**:
- Similar to useLabs but scoped to a specific lab
- Requires `labId` parameter
- Manages nodes within a lab

### 3. Context API Integration

**AuthProvider**:
```javascript
<AuthProvider>
  <App />
</AuthProvider>
```
- Wraps entire application
- Provides authentication state globally
- Used with `useAuthContext()` hook

**LabsProvider**:
```javascript
<LabsProvider>
  <App />
</LabsProvider>
```
- Wraps entire application
- Provides labs state globally
- Used with `useLabsContext()` hook

### 4. Protected Routes

**ProtectedRoute Component**:
```javascript
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```
- Checks if user is authenticated
- Shows loading state during auth check
- Redirects to login if not authenticated
- Can be extended for role-based access

### 5. Error Handling

**Request Interceptor**:
- Automatically adds JWT token from localStorage
- Can be extended for other headers

**Response Interceptor**:
- Catches 401 errors and redirects to login
- Can be extended for other error codes
- Maintains error messages from backend

**Local Error States**:
- Each hook manages its own error state
- Components display error messages
- Can implement retry logic

## Usage Examples

### Login Flow

```javascript
import { useAuthContext } from './context/AuthContext';

function LoginForm() {
  const { login, loading, error } = useAuthContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      // Redirect happens automatically
    } catch (err) {
      // Error is shown in component
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} />
      <button disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      {error && <div>{error}</div>}
    </form>
  );
}
```

### Labs Management

```javascript
import { useLabsContext } from './context/LabsContext';

function LabsList() {
  const { labs, loading, startLab, stopLab, deleteLab } = useLabsContext();

  return (
    <div>
      {labs.map(lab => (
        <div key={lab.id}>
          <h3>{lab.name}</h3>
          <button onClick={() => startLab(lab.id)}>Start</button>
          <button onClick={() => stopLab(lab.id)}>Stop</button>
          <button onClick={() => deleteLab(lab.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## Installation & Setup

### 1. Install Dependencies

```bash
cd frontend
npm install axios react-router-dom
```

### 2. Environment Variables

```bash
# .env
REACT_APP_API_URL=http://192.168.109.132:8000
REACT_APP_API_BASE_URL=/api
```

### 3. Wrap App with Providers

```javascript
// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LabsProvider } from './context/LabsContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <LabsProvider>
        <App />
      </LabsProvider>
    </AuthProvider>
  </React.StrictMode>
);
```

## Best Practices Implemented

✅ **Separation of Concerns**
- API logic in separate client files
- Business logic in custom hooks
- State management via Context API
- Components focus on UI

✅ **Reusability**
- Custom hooks can be used in multiple components
- Context API eliminates prop drilling
- Protected route component is generic

✅ **Security**
- JWT tokens stored and managed securely
- Automatic logout on 401 errors
- Backend handles all sensitive operations

✅ **Error Handling**
- Centralized request/response interceptors
- Local error states in hooks
- User-friendly error messages

✅ **Performance**
- useCallback prevents unnecessary re-renders
- Context API avoids prop drilling
- Lazy loading of routes (can be added)

✅ **Maintainability**
- Organized directory structure
- Clear naming conventions
- Consistent patterns across hooks
- Easy to add new features

## Testing Strategy

### Unit Tests
- Test hooks with mock API responses
- Test context providers
- Test component rendering

### Integration Tests
- Test auth flow end-to-end
- Test lab CRUD operations
- Test protected routes

### E2E Tests
- Test complete user flows
- Test error handling
- Test responsiveness

## Next Steps

1. Implement Phase 4: Testing (unit, integration, E2E)
2. Add styling and UI components
3. Implement Phase 5: Deployment
4. Set up CI/CD pipeline
5. Configure monitoring and logging

## File Structure Summary

- **api/client.js** - Base Axios configuration with interceptors
- **api/auth.js** - Authentication endpoints
- **api/labs.js** - Lab management endpoints
- **api/nodes.js** - Node management endpoints
- **api/networks.js** - Network management endpoints
- **hooks/useAuth.js** - Authentication hook
- **hooks/useLabs.js** - Labs management hook
- **hooks/useNodes.js** - Nodes management hook
- **context/AuthContext.js** - Authentication context provider
- **context/LabsContext.js** - Labs context provider
- **components/ProtectedRoute.js** - Route protection component
- **pages/LoginPage.js** - Login page
- **pages/DashboardPage.js** - Dashboard page
- **pages/LabsPage.js** - Labs management page
- **App.js** - Main app with routing
