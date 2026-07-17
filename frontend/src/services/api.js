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
  httpsAgent: {
    rejectUnauthorized: false, // For self-signed certificates
  },
});

// Create axios instance for backend API
const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptors to handle EVE-NG API format
eveNgApi.interceptors.response.use(
  (response) => {
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
    console.error('EVE-NG API Error:', error);
    return Promise.reject(error);
  }
);

// ==================== EVE-NG AUTHENTICATION ====================

/**
 * Authenticate with EVE-NG Server
 * @param {string} username - EVE-NG username
 * @param {string} password - EVE-NG password
 * @returns {Promise} Authentication response
 */
export const loginToEveNG = async (username, password) => {
  try {
    const response = await eveNgApi.post('/auth/login', {
      username,
      password,
      html5: '-1', // Required for Pro version
    });

    // Save credentials for session management
    if (response.data.status === 'success') {
      localStorage.setItem('eve_ng_username', username);
      localStorage.setItem('eve_ng_authenticated', 'true');
      return response.data;
    }
    throw new Error('Authentication failed');
  } catch (error) {
    console.error('EVE-NG Login Error:', error);
    throw error.response?.data || error;
  }
};

/**
 * Logout from EVE-NG
 */
export const logoutFromEveNG = async () => {
  try {
    await eveNgApi.post('/auth/logout');
    localStorage.removeItem('eve_ng_username');
    localStorage.removeItem('eve_ng_authenticated');
  } catch (error) {
    console.error('EVE-NG Logout Error:', error);
    localStorage.removeItem('eve_ng_username');
    localStorage.removeItem('eve_ng_authenticated');
  }
};

/**
 * Check if authenticated with EVE-NG
 */
export const isEveNGAuthenticated = () => {
  return localStorage.getItem('eve_ng_authenticated') === 'true';
};

// ==================== CLUSTER & SYSTEM STATUS ====================

/**
 * Get real-time cluster status from EVE-NG
 * Endpoint: GET /api/cluster
 * Returns cluster node information and status
 */
export const fetchClusterStatus = async () => {
  try {
    const response = await eveNgApi.get('/cluster');
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching cluster status:', error);
    throw error;
  }
};

/**
 * Get system status from EVE-NG
 * Endpoint: GET /api/status
 * Returns system statistics (CPU, Memory, Disk, Labs, etc.)
 */
export const fetchSystemStatus = async () => {
  try {
    const response = await eveNgApi.get('/status');
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching system status:', error);
    throw error;
  }
};

/**
 * Get combined cluster and system status
 * Fetches both endpoints for complete system information
 */
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

/**
 * Get list of all labs
 * Endpoint: GET /api/labs
 */
export const fetchEveNGLabs = async () => {
  try {
    const response = await eveNgApi.get('/labs');
    const labs = response.data?.data || {};
    // Convert object to array if needed
    return typeof labs === 'object' ? Object.values(labs) : labs;
  } catch (error) {
    console.error('Error fetching EVE-NG labs:', error);
    return [];
  }
};

/**
 * Get lab details
 * Endpoint: GET /api/labs/{lab_id}
 */
export const fetchLabDetails = async (labId) => {
  try {
    const response = await eveNgApi.get(`/labs/${labId}`);
    return response.data?.data || {};
  } catch (error) {
    console.error(`Error fetching lab ${labId} details:`, error);
    throw error;
  }
};

/**
 * Create new lab
 * Endpoint: POST /api/labs
 */
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

/**
 * Update lab
 * Endpoint: PUT /api/labs/{lab_id}
 */
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

/**
 * Delete lab
 * Endpoint: DELETE /api/labs/{lab_id}
 */
export const deleteEveNGLab = async (labId) => {
  try {
    await eveNgApi.delete(`/labs/${labId}`);
  } catch (error) {
    console.error('Error deleting lab:', error);
    throw error;
  }
};

/**
 * Start lab (power on all nodes)
 * Endpoint: POST /api/labs/{lab_id}/start
 */
export const startEveNGLab = async (labId) => {
  try {
    const response = await eveNgApi.post(`/labs/${labId}/start`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error starting lab:', error);
    throw error;
  }
};

/**
 * Stop lab (power off all nodes)
 * Endpoint: POST /api/labs/{lab_id}/stop
 */
export const stopEveNGLab = async (labId) => {
  try {
    const response = await eveNgApi.post(`/labs/${labId}/stop`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error stopping lab:', error);
    throw error;
  }
};

/**
 * Get lab statistics
 * Endpoint: GET /api/labs/{lab_id}/stats
 */
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

/**
 * Get all available templates
 * Endpoint: GET /api/list/templates
 */
export const fetchAllTemplates = async () => {
  try {
    const response = await eveNgApi.get('/list/templates');
    const templates = response.data?.data || {};
    // Convert object to array if needed
    return typeof templates === 'object' ? Object.values(templates) : templates;
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
};

/**
 * Get template devices/nodes
 * Endpoint: GET /api/list/templates/{template_name}
 */
export const fetchTemplateDevices = async (templateName) => {
  try {
    const response = await eveNgApi.get(`/list/templates/${templateName}`);
    const data = response.data?.data || {};
    
    // EVE-NG returns devices as an object, convert to array
    if (typeof data === 'object') {
      return Object.values(data);
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching template ${templateName} devices:`, error);
    return [];
  }
};

/**
 * Get node types/images
 * Endpoint: GET /api/list/nodes
 */
export const fetchNodeTypes = async () => {
  try {
    const response = await eveNgApi.get('/list/nodes');
    const nodes = response.data?.data || {};
    // Convert object to array if needed
    return typeof nodes === 'object' ? Object.values(nodes) : nodes;
  } catch (error) {
    console.error('Error fetching node types:', error);
    return [];
  }
};

// ==================== DASHBOARD & MONITORING ====================

/**
 * Get comprehensive dashboard statistics
 * Combines cluster status, system status, and lab information
 */
export const fetchDashboardStats = async () => {
  try {
    const [systemStatus, labs] = await Promise.all([
      fetchSystemStatus(),
      fetchEveNGLabs(),
    ]);

    return {
      total_labs: Object.keys(systemStatus.labs || {}).length || 0,
      running_labs: systemStatus.running_labs || 0,
      stopped_labs: systemStatus.stopped_labs || 0,
      active_users: systemStatus.active_users || 0,
      cpu_percent: systemStatus.cpu_percent || 0,
      memory_percent: systemStatus.memory_percent || 0,
      disk_usage: systemStatus.disk_usage || '0GB',
      uptime: systemStatus.uptime || '0h',
      version: systemStatus.version || 'Unknown',
      labs: labs,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      total_labs: 0,
      running_labs: 0,
      stopped_labs: 0,
      active_users: 0,
      cpu_percent: 0,
      memory_percent: 0,
      disk_usage: '0GB',
      uptime: '0h',
      version: 'Unknown',
      labs: [],
    };
  }
};

/**
 * Get active users
 * Endpoint: GET /api/list/users
 */
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

export const deleteUser = async (userId) => {
  try {
    await api.delete(`/users/${userId}`);
  } catch (error) {
    console.error('Error deleting user:', error);
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
