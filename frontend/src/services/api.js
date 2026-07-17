import axios from 'axios';

// EVE-NG Server Configuration
const EVE_NG_IP = process.env.REACT_APP_EVE_NG_IP || '192.168.2.11';
const EVE_NG_FQDN = process.env.REACT_APP_EVE_NG_FQDN || 'evengvlab4you.ddns.net';
const EVE_NG_PORT = process.env.REACT_APP_EVE_NG_PORT || '8443';
const EVE_NG_PROTOCOL = process.env.REACT_APP_EVE_NG_PROTOCOL || 'https';

// EVE-NG API Base URL
const EVE_NG_BASE_URL = `${EVE_NG_PROTOCOL}://${EVE_NG_FQDN}:${EVE_NG_PORT}/api`;

// Backend API URLs (if applicable)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_PREFIX = process.env.REACT_APP_API_BASE_URL || '/api';

// Create axios instance for EVE-NG Direct API
const eveNgApi = axios.create({
  baseURL: EVE_NG_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie-based auth
});

// Create axios instance for backend API
const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
eveNgApi.interceptors.request.use(
  (config) => {
    console.log(`[EVE-NG API] ${config.method.toUpperCase()} ${EVE_NG_BASE_URL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptors to handle EVE-NG API format
eveNgApi.interceptors.response.use(
  (response) => {
    console.log(`[EVE-NG API Response]`, response.data);
    // EVE-NG returns responses in JSend format: { status: "success", code: 200, data: {...} }
    if (response.data && response.data.status === 'success') {
      return response;
    }
    if (response.data && response.data.status === 'fail') {
      throw new Error(response.data.message || 'EVE-NG API Error');
    }
    return response;
  },
  (error) => {
    console.error('[EVE-NG API Error] Full Error:', error);
    if (error.response) {
      console.error('[EVE-NG API] Response status:', error.response.status);
      console.error('[EVE-NG API] Response data:', error.response.data);
      return Promise.reject(error.response.data || error.message);
    } else if (error.request) {
      console.error('[EVE-NG API] No response received:', error.request);
      return Promise.reject(new Error('No response from EVE-NG server. Check connection and CORS settings.'));
    } else {
      console.error('[EVE-NG API] Error:', error.message);
      return Promise.reject(error);
    }
  }
);

// ==================== EVE-NG AUTHENTICATION ====================

export const loginToEveNG = async (username, password) => {
  try {
    console.log('[Auth] Attempting login with username:', username);
    const response = await eveNgApi.post('/auth/login', {
      username,
      password,
      html5: '-1',
    });

    if (response.data.status === 'success') {
      localStorage.setItem('eve_ng_username', username);
      localStorage.setItem('eve_ng_authenticated', 'true');
      console.log('[Auth] Login successful');
      return response.data;
    }
    throw new Error('Authentication failed');
  } catch (error) {
    console.error('[Auth] Login Error:', error);
    throw error.response?.data || error;
  }
};

export const logoutFromEveNG = async () => {
  try {
    await eveNgApi.post('/auth/logout');
    localStorage.removeItem('eve_ng_username');
    localStorage.removeItem('eve_ng_authenticated');
    console.log('[Auth] Logout successful');
  } catch (error) {
    console.error('[Auth] Logout Error:', error);
    localStorage.removeItem('eve_ng_username');
    localStorage.removeItem('eve_ng_authenticated');
  }
};

export const isEveNGAuthenticated = () => {
  return localStorage.getItem('eve_ng_authenticated') === 'true';
};

// ==================== CLUSTER & SYSTEM STATUS ====================

export const fetchClusterStatus = async () => {
  try {
    console.log('[API] Fetching cluster status...');
    const response = await eveNgApi.get('/cluster');
    const data = response.data?.data || {};
    console.log('[API] Cluster status:', data);
    return data;
  } catch (error) {
    console.error('[API] Error fetching cluster status:', error);
    // Return graceful fallback
    return {
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

export const fetchSystemStatus = async () => {
  try {
    console.log('[API] Fetching system status...');
    const response = await eveNgApi.get('/status');
    const data = response.data?.data || {};
    console.log('[API] System status:', data);
    return data;
  } catch (error) {
    console.error('[API] Error fetching system status:', error);
    // Return graceful fallback
    return {
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

export const fetchCompleteSystemStatus = async () => {
  try {
    const [clusterResponse, statusResponse] = await Promise.all([
      eveNgApi.get('/cluster'),
      eveNgApi.get('/status'),
    ]);

    const clusterData = clusterResponse.data?.data || {};
    const statusData = statusResponse.data?.data || {};

    return {
      cluster: clusterData,
      status: statusData,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching complete system status:', error);
    throw error;
  }
};

// ==================== EVE-NG LABS ====================

export const fetchEveNGLabs = async () => {
  try {
    console.log('[API] Fetching labs...');
    const response = await eveNgApi.get('/labs');
    const labs = response.data?.data || {};
    const result = typeof labs === 'object' ? Object.values(labs) : labs;
    console.log('[API] Labs fetched:', result);
    return result;
  } catch (error) {
    console.error('[API] Error fetching EVE-NG labs:', error);
    return [];
  }
};

export const fetchLabDetails = async (labId) => {
  try {
    const response = await eveNgApi.get(`/labs/${labId}`);
    return response.data?.data || {};
  } catch (error) {
    console.error(`Error fetching lab ${labId} details:`, error);
    throw error;
  }
};

export const createEveNGLab = async (labData) => {
  try {
    const response = await eveNgApi.post('/labs', {
      name: labData.name,
      description: labData.description || '',
      topology: labData.topology || {},
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error creating EVE-NG lab:', error);
    throw error.response?.data || error;
  }
};

export const updateEveNGLab = async (labId, labData) => {
  try {
    const response = await eveNgApi.put(`/labs/${labId}`, {
      name: labData.name,
      description: labData.description,
      topology: labData.topology,
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error updating lab:', error);
    throw error;
  }
};

export const deleteEveNGLab = async (labId) => {
  try {
    await eveNgApi.delete(`/labs/${labId}`);
  } catch (error) {
    console.error('Error deleting lab:', error);
    throw error;
  }
};

export const startEveNGLab = async (labId) => {
  try {
    const response = await eveNgApi.post(`/labs/${labId}/start`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error starting lab:', error);
    throw error;
  }
};

export const stopEveNGLab = async (labId) => {
  try {
    const response = await eveNgApi.post(`/labs/${labId}/stop`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error stopping lab:', error);
    throw error;
  }
};

export const fetchLabStats = async (labId) => {
  try {
    const response = await eveNgApi.get(`/labs/${labId}/stats`);
    return response.data?.data || {};
  } catch (error) {
    console.error(`Error fetching lab ${labId} stats:`, error);
    return {};
  }
};

// ==================== EVE-NG TEMPLATES ====================

export const fetchAllTemplates = async () => {
  try {
    console.log('[API] Fetching templates...');
    const response = await eveNgApi.get('/list/templates');
    const templates = response.data?.data || {};
    const result = typeof templates === 'object' ? Object.values(templates) : templates;
    console.log('[API] Templates:', result);
    return result;
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
};

export const fetchTemplateDevices = async (templateName) => {
  try {
    const response = await eveNgApi.get(`/list/templates/${templateName}`);
    const data = response.data?.data || {};
    
    if (typeof data === 'object') {
      return Object.values(data);
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching template ${templateName} devices:`, error);
    return [];
  }
};

export const fetchNodeTypes = async () => {
  try {
    const response = await eveNgApi.get('/list/nodes');
    const nodes = response.data?.data || {};
    return typeof nodes === 'object' ? Object.values(nodes) : nodes;
  } catch (error) {
    console.error('Error fetching node types:', error);
    return [];
  }
};

export const fetchEveNGTopology = async (labId) => {
  try {
    const response = await eveNgApi.get(`/labs/${labId}/topology`);
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching topology:', error);
    return {};
  }
};

// ==================== DASHBOARD & MONITORING ====================

export const fetchDashboardStats = async () => {
  try {
    console.log('[API] Fetching dashboard stats...');
    const [systemStatus, labs] = await Promise.all([
      fetchSystemStatus(),
      fetchEveNGLabs(),
    ]);

    const stats = {
      total_labs: Array.isArray(labs) ? labs.length : 0,
      running_labs: systemStatus?.running_labs || 0,
      stopped_labs: systemStatus?.stopped_labs || 0,
      active_users: systemStatus?.active_users || 0,
      cpu_percent: systemStatus?.cpu_percent || 0,
      memory_percent: systemStatus?.memory_percent || 0,
      disk_percent: systemStatus?.disk_percent || 0,
      disk_usage: systemStatus?.disk_usage || '0GB',
      uptime: systemStatus?.uptime || '0h',
      version: systemStatus?.version || 'Unknown',
      labs: labs,
    };

    console.log('[API] Dashboard stats:', stats);
    return stats;
  } catch (error) {
    console.error('[API] Error fetching dashboard stats:', error);
    return {
      total_labs: 0,
      running_labs: 0,
      stopped_labs: 0,
      active_users: 0,
      cpu_percent: 0,
      memory_percent: 0,
      disk_percent: 0,
      disk_usage: '0GB',
      uptime: '0h',
      version: 'Unknown',
      labs: [],
    };
  }
};

export const fetchActiveUsers = async () => {
  try {
    const response = await eveNgApi.get('/list/users');
    const users = response.data?.data || {};
    return typeof users === 'object' ? Object.values(users) : users;
  } catch (error) {
    console.error('Error fetching active users:', error);
    return [];
  }
};

export const fetchLabMetrics = async (labId) => {
  try {
    const response = await eveNgApi.get(`/labs/${labId}/metrics`);
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching lab metrics:', error);
    return {};
  }
};

// ==================== LAB OPERATIONS (Wrapper Functions) ====================

export const fetchLabs = async () => {
  return fetchEveNGLabs();
};

export const getLab = async (labId) => {
  return fetchLabDetails(labId);
};

export const updateLabStatus = async (labId, status) => {
  try {
    if (status === 'running' || status === 'start') {
      return await startEveNGLab(labId);
    } else if (status === 'stopped' || status === 'stop') {
      return await stopEveNGLab(labId);
    }
  } catch (error) {
    console.error('Error updating lab status:', error);
    throw error;
  }
};

export const deleteLab = async (labId) => {
  return deleteEveNGLab(labId);
};

export const startLab = async (labId) => {
  return startEveNGLab(labId);
};

export const stopLab = async (labId) => {
  return stopEveNGLab(labId);
};

export const createLab = async (name, description, topology) => {
  return createEveNGLab({ name, description, topology });
};

export const deployLab = async (labId, options = {}) => {
  try {
    const response = await eveNgApi.post(`/labs/${labId}/deploy`, options);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error deploying lab:', error);
    throw error;
  }
};

// ==================== PREBUILT LAB CATEGORIES ====================

export const fetchSDWANLabs = async () => {
  try {
    const labs = await fetchEveNGLabs();
    return Array.isArray(labs)
      ? labs.filter((lab) => lab.name?.toLowerCase().includes('sdwan'))
      : [];
  } catch (error) {
    console.error('Error fetching SD-WAN labs:', error);
    return [];
  }
};

export const fetchRoutingLabs = async () => {
  try {
    const labs = await fetchEveNGLabs();
    return Array.isArray(labs)
      ? labs.filter((lab) => lab.name?.toLowerCase().includes('routing'))
      : [];
  } catch (error) {
    console.error('Error fetching Routing labs:', error);
    return [];
  }
};

export const fetchSecurityLabs = async () => {
  try {
    const labs = await fetchEveNGLabs();
    return Array.isArray(labs)
      ? labs.filter((lab) => lab.name?.toLowerCase().includes('security'))
      : [];
  } catch (error) {
    console.error('Error fetching Security labs:', error);
    return [];
  }
};

// ==================== TEMPLATE MANAGEMENT ====================

export const uploadTemplate = async (formData, onUploadProgress) => {
  try {
    const response = await api.post('/templates/upload', formData, {
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
    console.error('Error uploading template:', error);
    throw error.response?.data || error;
  }
};

export const fetchUploadedTemplates = async (category = null) => {
  try {
    const response = await api.get('/templates/uploaded', {
      params: category ? { category } : {},
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching uploaded templates:', error);
    return [];
  }
};

export const deleteTemplate = async (templateId) => {
  try {
    await api.delete(`/templates/${templateId}`);
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};

export const publishTemplate = async (templateData) => {
  try {
    const response = await api.post('/templates/publish', {
      name: templateData.name,
      description: templateData.description,
      topology: templateData.topology,
      is_public: templateData.isPublic,
    });
    return response.data;
  } catch (error) {
    console.error('Error publishing template:', error);
    throw error;
  }
};

// ==================== RESERVATIONS ====================

export const fetchReservations = async () => {
  try {
    const response = await api.get('/reservations');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }
};

export const createReservation = async (labId, userId, startTime, endTime) => {
  try {
    const response = await api.post('/reservations', {
      lab_id: labId,
      user_id: userId,
      start_time: startTime,
      end_time: endTime,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

export const updateReservation = async (reservationId, data) => {
  try {
    const response = await api.put(`/reservations/${reservationId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }
};

export const deleteReservation = async (reservationId) => {
  try {
    await api.delete(`/reservations/${reservationId}`);
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
};

// ==================== USER MANAGEMENT ====================

export const fetchUsers = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get('/users', {
      params: { skip, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const createUser = async (username, email, password, role) => {
  try {
    const response = await api.post('/users', {
      username,
      email,
      password,
      role,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    await api.delete(`/users/${userId}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// ==================== SYSTEM CONFIGURATION ====================

export const fetchSystemConfig = async () => {
  try {
    const response = await api.get('/system/config');
    return response.data;
  } catch (error) {
    console.error('Error fetching system config:', error);
    return {};
  }
};

export const updateSystemConfig = async (config) => {
  try {
    const response = await api.put('/system/config', config);
    return response.data;
  } catch (error) {
    console.error('Error updating system config:', error);
    throw error;
  }
};

// ==================== MONITORING & LOGS ====================

export const fetchUserActivity = async (userId = null, limit = 100) => {
  try {
    const response = await api.get('/activity', {
      params: userId ? { user_id: userId, limit } : { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return [];
  }
};

export const fetchSystemLogs = async (limit = 100, offset = 0) => {
  try {
    const response = await api.get('/logs', {
      params: { limit, offset },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching system logs:', error);
    return [];
  }
};

export const generateReport = async (reportType, dateRange) => {
  try {
    const response = await api.post('/reports/generate', {
      type: reportType,
      start_date: dateRange.start,
      end_date: dateRange.end,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

// ==================== CONFIGURATION ====================

export const getServerConfig = () => ({
  ip: EVE_NG_IP,
  fqdn: EVE_NG_FQDN,
  port: EVE_NG_PORT,
  protocol: EVE_NG_PROTOCOL,
  baseUrl: API_BASE_URL,
  eveNgApiUrl: EVE_NG_BASE_URL,
});

export default api;
