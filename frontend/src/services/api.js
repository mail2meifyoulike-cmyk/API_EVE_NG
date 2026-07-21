/**
 * CORRECTED API Service Module
 * 
 * PROPER ARCHITECTURE:
 * - Frontend communicates ONLY with backend
 * - Backend acts as proxy to EVE-NG
 * - EVE-NG credentials stored ONLY on backend
 * - No direct frontend-to-EVE-NG calls
 */

import axios from 'axios';

/**
 * SINGLE Axios instance for all API calls
 * Points to backend, NOT EVE-NG directly
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies (session)
});

// ==================== AUTHENTICATION ====================

/**
 * Login to EVE-NG through backend
 * 
 * Frontend sends: username, password
 * Backend calls: EVE-NG API
 * Backend returns: session status
 * Browser stores: HTTP-only session cookie (secure)
 */
export const loginUser = async (username, password) => {
  try {
    console.log('[Auth] Attempting login through backend');
    const response = await api.post('/api/auth/login', {
      username,
      password,
    });
    
    if (response.data.success) {
      console.log('[Auth] Login successful');
      return response.data;
    }
    throw new Error('Login failed');
  } catch (error) {
    console.error('[Auth] Login error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Logout user
 * Backend clears session
 */
export const logoutUser = async () => {
  try {
    console.log('[Auth] Logging out');
    await api.post('/api/auth/logout');
    console.log('[Auth] Logout successful');
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    // Still logout on frontend even if backend fails
  }
};

/**
 * Check authentication status
 */
export const checkAuthStatus = async () => {
  try {
    const response = await api.get('/api/auth/status');
    return response.data;
  } catch (error) {
    console.error('[Auth] Status check error:', error);
    return { authenticated: false, username: null };
  }
};

// ==================== SYSTEM STATUS ====================

/**
 * Fetch system status (cluster, EVE-NG health, etc.)
 * All calls go through backend → EVE-NG
 */
export const fetchSystemStatus = async () => {
  try {
    console.log('[API] Fetching system status');
    const response = await api.get('/api/status'); // ✓ Backend, not EVE-NG
    return response.data || {};
  } catch (error) {
    console.error('[API] System status error:', error);
    return { error: error.message, timestamp: new Date().toISOString() };
  }
};

export const fetchClusterStatus = async () => {
  try {
    console.log('[API] Fetching cluster status');
    const response = await api.get('/api/status/cluster'); // ✓ Backend proxy
    return response.data || {};
  } catch (error) {
    console.error('[API] Cluster status error:', error);
    return { error: error.message };
  }
};

export const fetchCompleteSystemStatus = async () => {
  try {
    const [statusResponse, clusterResponse] = await Promise.all([
      api.get('/api/status'), // ✓ Backend proxy
      api.get('/api/status/cluster'),
    ]);
    
    return {
      status: statusResponse.data || {},
      cluster: clusterResponse.data || {},
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[API] Error fetching complete system status:', error);
    throw error;
  }
};

// ==================== LABS ====================

/**
 * Fetch all labs
 * Backend fetches from EVE-NG, applies business logic
 */
export const fetchLabs = async () => {
  try {
    console.log('[API] Fetching labs');
    const response = await api.get('/api/labs'); // ✓ Backend proxy
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('[API] Error fetching labs:', error);
    return [];
  }
};

export const fetchLabDetails = async (labId) => {
  try {
    const response = await api.get(`/api/labs/${labId}`); // ✓ Backend proxy
    return response.data?.data || response.data || {};
  } catch (error) {
    console.error(`[API] Error fetching lab ${labId}:`, error);
    throw error;
  }
};

export const createLab = async (labData) => {
  try {
    const response = await api.post('/api/labs', { // ✓ Backend proxy
      name: labData.name,
      description: labData.description || '',
      topology: labData.topology || {},
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[API] Error creating lab:', error);
    throw error.response?.data || error;
  }
};

export const updateLab = async (labId, labData) => {
  try {
    const response = await api.put(`/api/labs/${labId}`, { // ✓ Backend proxy
      name: labData.name,
      description: labData.description,
      topology: labData.topology,
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[API] Error updating lab:', error);
    throw error;
  }
};

export const deleteLab = async (labId) => {
  try {
    await api.delete(`/api/labs/${labId}`); // ✓ Backend proxy
  } catch (error) {
    console.error('[API] Error deleting lab:', error);
    throw error;
  }
};

export const startLab = async (labId) => {
  try {
    const response = await api.post(`/api/labs/${labId}/start`); // ✓ Backend proxy
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[API] Error starting lab:', error);
    throw error;
  }
};

export const stopLab = async (labId) => {
  try {
    const response = await api.post(`/api/labs/${labId}/stop`); // ✓ Backend proxy
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[API] Error stopping lab:', error);
    throw error;
  }
};

export const fetchLabStats = async (labId) => {
  try {
    const response = await api.get(`/api/labs/${labId}/stats`); // ✓ Backend proxy
    return response.data?.data || {};
  } catch (error) {
    console.error('[API] Error fetching lab stats:', error);
    return {};
  }
};

// ==================== TEMPLATES ====================

export const fetchAllTemplates = async () => {
  try {
    console.log('[API] Fetching templates');
    const response = await api.get('/api/templates'); // ✓ Backend proxy
    return response.data?.data || [];
  } catch (error) {
    console.error('[API] Error fetching templates:', error);
    return [];
  }
};

export const uploadTemplate = async (formData, onUploadProgress) => {
  try {
    const response = await api.post('/api/templates/upload', formData, { // ✓ Backend proxy
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          onUploadProgress(progressEvent);
        }
      },
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error uploading template:', error);
    throw error.response?.data || error;
  }
};

export const deleteTemplate = async (templateId) => {
  try {
    await api.delete(`/api/templates/${templateId}`); // ✓ Backend proxy
  } catch (error) {
    console.error('[API] Error deleting template:', error);
    throw error;
  }
};

// ==================== USERS ====================

export const fetchUsers = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get('/api/users', { // ✓ Backend proxy
      params: { skip, limit },
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error fetching users:', error);
    return [];
  }
};

export const createUser = async (username, email, password, role) => {
  try {
    const response = await api.post('/api/users', { // ✓ Backend proxy
      username,
      email,
      password,
      role,
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/api/users/${userId}`, userData); // ✓ Backend proxy
    return response.data;
  } catch (error) {
    console.error('[API] Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    await api.delete(`/api/users/${userId}`); // ✓ Backend proxy
  } catch (error) {
    console.error('[API] Error deleting user:', error);
    throw error;
  }
};

// ==================== SYSTEM CONFIGURATION ====================

export const fetchSystemConfig = async () => {
  try {
    const response = await api.get('/api/config'); // ✓ Backend proxy
    return response.data;
  } catch (error) {
    console.error('[API] Error fetching config:', error);
    return {};
  }
};

export const updateSystemConfig = async (config) => {
  try {
    const response = await api.put('/api/config', config); // ✓ Backend proxy
    return response.data;
  } catch (error) {
    console.error('[API] Error updating config:', error);
    throw error;
  }
};

// ==================== ACTIVITY & LOGS ====================

export const fetchUserActivity = async (userId = null, limit = 100) => {
  try {
    const response = await api.get('/api/activity', { // ✓ Backend proxy
      params: userId ? { user_id: userId, limit } : { limit },
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error fetching user activity:', error);
    return [];
  }
};

export const fetchSystemLogs = async (limit = 100, offset = 0) => {
  try {
    const response = await api.get('/api/logs', { // ✓ Backend proxy
      params: { limit, offset },
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error fetching logs:', error);
    return [];
  }
};

/**
 * Export the base API instance for advanced usage
 * But always route through /api/* paths
 */
export default api;

/**
 * IMPORTANT NOTES:
 * 
 * ✓ CORRECT:
 * - All calls use /api/* paths
 * - Backend acts as proxy to EVE-NG
 * - Session stored in HTTP-only cookie
 * - No EVE-NG credentials in frontend
 * - No direct EVE-NG API calls
 * 
 * ✗ WRONG (DON'T DO):
 * - Creating separate EVE-NG axios instance
 * - Calling EVE-NG URLs directly
 * - Storing EVE-NG tokens in localStorage
 * - Using environment variables for EVE-NG URLs
 * - Making CORS requests to EVE-NG from frontend
 */
