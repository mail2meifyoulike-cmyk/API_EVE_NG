# Phase 3: Frontend Refactoring - Complete Implementation Guide

## Overview

This phase organizes the frontend codebase into modular, reusable components following React best practices. The refactoring focuses on:
- Organizing API clients by resource
- Creating custom hooks for data fetching and state management
- Setting up Context API for global state management
- Implementing proper error handling and loading states

---

## 1. API Client Organization

### Structure
```
frontend/src/api/
├── client.js              # Base Axios instance
├── auth.js                # Authentication endpoints
├── labs.js                # Lab endpoints
├── nodes.js               # Node endpoints
├── networks.js            # Network endpoints
├── templates.js           # Template endpoints
├── images.js              # Image endpoints
├── monitoring.js          # Monitoring endpoints
├── deployments.js         # Deployment endpoints
└── system.js              # System endpoints
```

### Implementation

#### 1.1 api/client.js
```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_PREFIX = process.env.REACT_APP_API_BASE_URL || '/api';

// Create base axios instance
const client = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session management
});

// Request interceptor - Add auth token if available
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access denied');
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default client;
```

#### 1.2 api/auth.js
```javascript
import client from './client';

export const authAPI = {
  // User login
  login: async (username, password) => {
    const response = await client.post('/auth/login', {
      username,
      password,
    });
    return response.data;
  },

  // User logout
  logout: async () => {
    const response = await client.post('/auth/logout');
    return response.data;
  },

  // Get current user status
  getStatus: async () => {
    const response = await client.get('/auth/status');
    return response.data;
  },

  // Refresh auth token
  refresh: async () => {
    const response = await client.post('/auth/refresh');
    return response.data;
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    const response = await client.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};

export default authAPI;
```

#### 1.3 api/labs.js
```javascript
import client from './client';

export const labsAPI = {
  // List all labs
  listLabs: async (filters = {}) => {
    const response = await client.get('/labs', { params: filters });
    return response.data;
  },

  // Get lab details
  getLabDetails: async (labId) => {
    const response = await client.get(`/labs/${labId}`);
    return response.data;
  },

  // Create new lab
  createLab: async (labData) => {
    const response = await client.post('/labs', labData);
    return response.data;
  },

  // Update lab
  updateLab: async (labId, labData) => {
    const response = await client.put(`/labs/${labId}`, labData);
    return response.data;
  },

  // Delete lab
  deleteLab: async (labId) => {
    const response = await client.delete(`/labs/${labId}`);
    return response.data;
  },

  // Start lab
  startLab: async (labId) => {
    const response = await client.post(`/labs/${labId}/start`);
    return response.data;
  },

  // Stop lab
  stopLab: async (labId) => {
    const response = await client.post(`/labs/${labId}/stop`);
    return response.data;
  },

  // Get lab status
  getLabStatus: async (labId) => {
    const response = await client.get(`/labs/${labId}/status`);
    return response.data;
  },

  // Export lab
  exportLab: async (labId) => {
    const response = await client.post(`/labs/${labId}/export`);
    return response.data;
  },

  // Import lab
  importLab: async (labFile) => {
    const formData = new FormData();
    formData.append('file', labFile);
    const response = await client.post('/labs/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default labsAPI;
```

#### 1.4 api/nodes.js
```javascript
import client from './client';

export const nodesAPI = {
  // List nodes in lab
  listNodes: async (labId) => {
    const response = await client.get(`/labs/${labId}/nodes`);
    return response.data;
  },

  // Get node details
  getNodeDetails: async (labId, nodeId) => {
    const response = await client.get(`/labs/${labId}/nodes/${nodeId}`);
    return response.data;
  },

  // Create node
  createNode: async (labId, nodeData) => {
    const response = await client.post(`/labs/${labId}/nodes`, nodeData);
    return response.data;
  },

  // Update node
  updateNode: async (labId, nodeId, nodeData) => {
    const response = await client.put(
      `/labs/${labId}/nodes/${nodeId}`,
      nodeData
    );
    return response.data;
  },

  // Delete node
  deleteNode: async (labId, nodeId) => {
    const response = await client.delete(`/labs/${labId}/nodes/${nodeId}`);
    return response.data;
  },

  // Start node
  startNode: async (labId, nodeId) => {
    const response = await client.post(`/labs/${labId}/nodes/${nodeId}/start`);
    return response.data;
  },

  // Stop node
  stopNode: async (labId, nodeId) => {
    const response = await client.post(`/labs/${labId}/nodes/${nodeId}/stop`);
    return response.data;
  },

  // Get node console
  getNodeConsole: async (labId, nodeId) => {
    const response = await client.get(
      `/labs/${labId}/nodes/${nodeId}/console`
    );
    return response.data;
  },
};

export default nodesAPI;
```

#### 1.5 api/networks.js
```javascript
import client from './client';

export const networksAPI = {
  // List networks in lab
  listNetworks: async (labId) => {
    const response = await client.get(`/labs/${labId}/networks`);
    return response.data;
  },

  // Get network details
  getNetworkDetails: async (labId, networkId) => {
    const response = await client.get(`/labs/${labId}/networks/${networkId}`);
    return response.data;
  },

  // Create network
  createNetwork: async (labId, networkData) => {
    const response = await client.post(`/labs/${labId}/networks`, networkData);
    return response.data;
  },

  // Update network
  updateNetwork: async (labId, networkId, networkData) => {
    const response = await client.put(
      `/labs/${labId}/networks/${networkId}`,
      networkData
    );
    return response.data;
  },

  // Delete network
  deleteNetwork: async (labId, networkId) => {
    const response = await client.delete(`/labs/${labId}/networks/${networkId}`);
    return response.data;
  },
};

export default networksAPI;
```

#### 1.6 api/templates.js
```javascript
import client from './client';

export const templatesAPI = {
  // List all templates
  listTemplates: async (filters = {}) => {
    const response = await client.get('/templates', { params: filters });
    return response.data;
  },

  // Get template details
  getTemplateDetails: async (templateId) => {
    const response = await client.get(`/templates/${templateId}`);
    return response.data;
  },

  // Create template
  createTemplate: async (templateData) => {
    const response = await client.post('/templates', templateData);
    return response.data;
  },

  // Update template
  updateTemplate: async (templateId, templateData) => {
    const response = await client.put(`/templates/${templateId}`, templateData);
    return response.data;
  },

  // Delete template
  deleteTemplate: async (templateId) => {
    const response = await client.delete(`/templates/${templateId}`);
    return response.data;
  },
};

export default templatesAPI;
```

#### 1.7 api/monitoring.js
```javascript
import client from './client';

export const monitoringAPI = {
  // Get lab metrics
  getLabMetrics: async (labId, timeRange = '1h') => {
    const response = await client.get(`/labs/${labId}/metrics`, {
      params: { time_range: timeRange },
    });
    return response.data;
  },

  // Get node metrics
  getNodeMetrics: async (labId, nodeId, timeRange = '1h') => {
    const response = await client.get(`/labs/${labId}/nodes/${nodeId}/metrics`, {
      params: { time_range: timeRange },
    });
    return response.data;
  },

  // Get system health
  getSystemHealth: async () => {
    const response = await client.get('/system/health');
    return response.data;
  },

  // Get performance stats
  getPerformanceStats: async (labId) => {
    const response = await client.get(`/labs/${labId}/performance`);
    return response.data;
  },
};

export default monitoringAPI;
```

---

## 2. Custom Hooks

### Structure
```
frontend/src/hooks/
├── useAuth.js                 # Authentication hook
├── useLabs.js                 # Labs data management
├── useNodes.js                # Nodes data management
├── useNetworks.js             # Networks data management
├── useMonitoring.js           # Real-time monitoring
├── useWebSocket.js            # WebSocket management
├── useQuery.js                # Generic query hook
├── useMutation.js             # Generic mutation hook
└── useLocalStorage.js         # Local storage hook
```

### Implementation

#### 2.1 hooks/useAuth.js
```javascript
import { useState, useCallback, useEffect } from 'react';
import { authAPI } from '../api/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.getStatus();
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login(username, password);
      localStorage.setItem('authToken', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authAPI.logout();
      localStorage.removeItem('authToken');
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      await authAPI.changePassword(oldPassword, newPassword);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus,
    changePassword,
  };
};

export default useAuth;
```

#### 2.2 hooks/useLabs.js
```javascript
import { useState, useCallback, useEffect } from 'react';
import { labsAPI } from '../api/labs';

export const useLabs = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all labs
  const fetchLabs = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await labsAPI.listLabs(filters);
      setLabs(response.data || []);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      setLabs([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get lab details
  const getLabDetails = useCallback(async (labId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await labsAPI.getLabDetails(labId);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create lab
  const createLab = useCallback(async (labData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await labsAPI.createLab(labData);
      setLabs([...labs, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [labs]);

  // Update lab
  const updateLab = useCallback(
    async (labId, labData) => {
      try {
        setLoading(true);
        setError(null);
        const response = await labsAPI.updateLab(labId, labData);
        setLabs(
          labs.map((lab) => (lab.id === labId ? response.data : lab))
        );
        return response.data;
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [labs]
  );

  // Delete lab
  const deleteLab = useCallback(
    async (labId) => {
      try {
        setLoading(true);
        setError(null);
        await labsAPI.deleteLab(labId);
        setLabs(labs.filter((lab) => lab.id !== labId));
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [labs]
  );

  // Start lab
  const startLab = useCallback(async (labId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await labsAPI.startLab(labId);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Stop lab
  const stopLab = useCallback(async (labId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await labsAPI.stopLab(labId);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    labs,
    loading,
    error,
    fetchLabs,
    getLabDetails,
    createLab,
    updateLab,
    deleteLab,
    startLab,
    stopLab,
  };
};

export default useLabs;
```

#### 2.3 hooks/useQuery.js
```javascript
import { useState, useEffect, useCallback } from 'react';

/**
 * Generic query hook for fetching data
 * @param {Function} queryFn - Async function to fetch data
 * @param {Object} options - Options object
 * @param {number} options.refetchInterval - Refetch interval in milliseconds
 * @param {Array} options.dependencies - Re-fetch when dependencies change
 * @param {boolean} options.enabled - Enable/disable query
 */
export const useQuery = (
  queryFn,
  options = {
    refetchInterval: null,
    dependencies: [],
    enabled: true,
  }
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!options.enabled) return;

    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [queryFn, options.enabled]);

  useEffect(() => {
    fetchData();

    // Setup refetch interval if specified
    let interval;
    if (options.refetchInterval) {
      interval = setInterval(fetchData, options.refetchInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, ...options.dependencies]);

  const refetch = useCallback(fetchData, [fetchData]);

  return { data, loading, error, refetch };
};

export default useQuery;
```

#### 2.4 hooks/useMutation.js
```javascript
import { useState, useCallback } from 'react';

/**
 * Generic mutation hook for creating/updating/deleting data
 * @param {Function} mutationFn - Async function to execute
 * @param {Object} options - Options object
 * @param {Function} options.onSuccess - Callback on success
 * @param {Function} options.onError - Callback on error
 */
export const useMutation = (
  mutationFn,
  options = { onSuccess: null, onError: null }
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const result = await mutationFn(...args);
        setData(result);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = err.response?.data?.detail || err.message;
        setError(errorMessage);
        options.onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, options]
  );

  return { mutate, loading, error, data };
};

export default useMutation;
```

---

## 3. Context API Setup

### Structure
```
frontend/src/context/
├── AuthContext.js             # Authentication state
├── LabsContext.js             # Labs state
├── NotificationContext.js     # Notifications/toasts
└── ThemeContext.js            # Theme management
```

### Implementation

#### 3.1 context/AuthContext.js
```javascript
import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const auth = useAuth();

  const value = {
    user: auth.user,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    login: auth.login,
    logout: auth.logout,
    changePassword: auth.changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
```

#### 3.2 context/LabsContext.js
```javascript
import React, { createContext, useContext } from 'react';
import { useLabs } from '../hooks/useLabs';

const LabsContext = createContext();

export const LabsProvider = ({ children }) => {
  const labs = useLabs();

  const value = {
    labs: labs.labs,
    loading: labs.loading,
    error: labs.error,
    fetchLabs: labs.fetchLabs,
    getLabDetails: labs.getLabDetails,
    createLab: labs.createLab,
    updateLab: labs.updateLab,
    deleteLab: labs.deleteLab,
    startLab: labs.startLab,
    stopLab: labs.stopLab,
  };

  return <LabsContext.Provider value={value}>{children}</LabsContext.Provider>;
};

export const useLabsContext = () => {
  const context = useContext(LabsContext);
  if (!context) {
    throw new Error('useLabsContext must be used within LabsProvider');
  }
  return context;
};

export default LabsContext;
```

#### 3.3 context/NotificationContext.js
```javascript
import React, { createContext, useContext, useCallback, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback(
    (message, type = 'info', duration = 3000) => {
      const id = Date.now();
      const notification = {
        id,
        message,
        type, // 'success', 'error', 'warning', 'info'
      };

      setNotifications((prev) => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    []
  );

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const success = useCallback(
    (message, duration = 3000) =>
      addNotification(message, 'success', duration),
    [addNotification]
  );

  const error = useCallback(
    (message, duration = 5000) => addNotification(message, 'error', duration),
    [addNotification]
  );

  const warning = useCallback(
    (message, duration = 4000) =>
      addNotification(message, 'warning', duration),
    [addNotification]
  );

  const info = useCallback(
    (message, duration = 3000) => addNotification(message, 'info', duration),
    [addNotification]
  );

  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within NotificationProvider'
    );
  }
  return context;
};

export default NotificationContext;
```

---

## 4. Frontend Integration Example

### App.js
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LabsProvider } from './context/LabsContext';
import { NotificationProvider } from './context/NotificationContext';
import { useAuthContext } from './context/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LabsList from './pages/Labs/LabsList';
import LabDetails from './pages/Labs/LabDetails';
import CreateLab from './pages/Labs/CreateLab';
import NotFound from './pages/NotFound';
import NotificationCenter from './components/NotificationCenter';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/labs"
        element={
          <ProtectedRoute>
            <LabsList />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/labs/new"
        element={
          <ProtectedRoute>
            <CreateLab />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/labs/:labId"
        element={
          <ProtectedRoute>
            <LabDetails />
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <LabsProvider>
          <Router>
            <NotificationCenter />
            <AppRoutes />
          </Router>
        </LabsProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
```

---

## 5. Component Usage Examples

### Example: Labs List Component
```javascript
import React, { useEffect } from 'react';
import { useLabsContext } from '../context/LabsContext';
import { useNotification } from '../context/NotificationContext';
import LabCard from '../components/LabCard';
import Loading from '../components/Loading';

const LabsList = () => {
  const { labs, loading, error, fetchLabs, deleteLab, startLab } = useLabsContext();
  const { success, error: notifyError } = useNotification();

  useEffect(() => {
    loadLabs();
  }, []);

  const loadLabs = async () => {
    try {
      await fetchLabs();
      success('Labs loaded successfully');
    } catch (err) {
      notifyError(`Failed to load labs: ${err.message}`);
    }
  };

  const handleDeleteLab = async (labId) => {
    try {
      await deleteLab(labId);
      success('Lab deleted successfully');
    } catch (err) {
      notifyError(`Failed to delete lab: ${err.message}`);
    }
  };

  const handleStartLab = async (labId) => {
    try {
      await startLab(labId);
      success('Lab started successfully');
    } catch (err) {
      notifyError(`Failed to start lab: ${err.message}`);
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return <div className="error">Error loading labs: {error}</div>;
  }

  return (
    <div className="labs-list">
      <h1>Labs</h1>
      {labs.length === 0 ? (
        <p>No labs available</p>
      ) : (
        <div className="labs-grid">
          {labs.map((lab) => (
            <LabCard
              key={lab.id}
              lab={lab}
              onDelete={() => handleDeleteLab(lab.id)}
              onStart={() => handleStartLab(lab.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LabsList;
```

---

## 6. Testing

### Unit Test Example: useAuth Hook
```javascript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';
import * as authAPI from '../api/auth';

jest.mock('../api/auth');

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('should check auth status on mount', async () => {
    authAPI.getStatus.mockResolvedValue({
      data: { user: { id: 1, username: 'test' } },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user.username).toBe('test');
    });
  });

  test('should login successfully', async () => {
    authAPI.login.mockResolvedValue({
      data: {
        token: 'test-token',
        user: { id: 1, username: 'test' },
      },
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test', 'password');
    });

    expect(localStorage.getItem('authToken')).toBe('test-token');
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

---

## 7. Migration Checklist

- [ ] Create all API client files (auth, labs, nodes, etc.)
- [ ] Create all custom hooks (useAuth, useLabs, useQuery, useMutation, etc.)
- [ ] Create Context providers (AuthContext, LabsContext, NotificationContext)
- [ ] Update App.js to use providers and protected routes
- [ ] Refactor page components to use hooks and context
- [ ] Refactor components to use API clients
- [ ] Add error handling and notifications
- [ ] Update environment variables
- [ ] Add unit tests for hooks
- [ ] Add component tests
- [ ] Test all workflows end-to-end

---

## 8. Key Principles

✅ **Separation of Concerns**: API calls, state management, and UI are separate
✅ **Reusability**: Hooks and context can be used across components
✅ **Testing**: Easy to test hooks and context in isolation
✅ **Error Handling**: Centralized error handling with notifications
✅ **Performance**: Memoization and efficient re-renders
✅ **Maintainability**: Clear structure and naming conventions

---

**Status**: Implementation Guide Complete
**Next Phase**: Phase 4 - Testing
