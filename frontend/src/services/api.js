import axios from 'axios';

// EVE-NG Server Configuration
const EVE_NG_IP = process.env.REACT_APP_EVE_NG_IP || '192.168.2.11';
const EVE_NG_FQDN = process.env.REACT_APP_EVE_NG_FQDN || 'evengvlab4you.ddns.net';
const EVE_NG_PORT = process.env.REACT_APP_EVE_NG_PORT || '8443';
const EVE_NG_PROTOCOL = process.env.REACT_APP_EVE_NG_PROTOCOL || 'https';

// Direct EVE-NG API URLs
const EVE_NG_API_URL = `${EVE_NG_PROTOCOL}://${EVE_NG_FQDN}:${EVE_NG_PORT}/api`;

// Backend API URLs (if applicable)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_PREFIX = process.env.REACT_APP_API_BASE_URL || '/api';

// Create axios instance for EVE-NG Direct API
const eveNgApi = axios.create({
  baseURL: EVE_NG_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Add auth interceptors
eveNgApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('eve_ng_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eve_ng_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== EVE-NG DIRECT API CALLS ====================

// EVE-NG Authentication
export const loginToEveNG = async (username, password) => {
  try {
    const response = await eveNgApi.post('/auth/login', {
      username,
      password,
    });
    if (response.data.data && response.data.data.token) {
      localStorage.setItem('eve_ng_token', response.data.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logoutFromEveNG = () => {
  localStorage.removeItem('eve_ng_token');
};

// Get Real-time Cluster Status from EVE-NG
export const fetchClusterStatus = async () => {
  try {
    const response = await eveNgApi.get('/status');
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching cluster status:', error);
    throw error;
  }
};

// Get System Information
export const fetchSystemInfo = async () => {
  try {
    const response = await eveNgApi.get('/system/info');
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching system info:', error);
    throw error;
  }
};

// ==================== EVE-NG TEMPLATES ====================

// Get all available templates
export const fetchAllTemplates = async () => {
  try {
    const response = await eveNgApi.get('/list/templates');
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
};

// Get specific template details and devices
export const fetchTemplateDevices = async (templateName) => {
  try {
    const response = await eveNgApi.get(`/list/templates/${templateName}`);
    return response.data?.data || {};
  } catch (error) {
    console.error(`Error fetching template ${templateName} devices:`, error);
    return {};
  }
};

// ==================== EVE-NG LABS ====================

// Get all labs
export const fetchEveNGLabs = async () => {
  try {
    const response = await eveNgApi.get('/labs');
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching EVE-NG labs:', error);
    return [];
  }
};

// Create new lab
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

// Get lab details
export const fetchLabDetails = async (labId) => {
  try {
    const response = await eveNgApi.get(`/labs/${labId}`);
    return response.data?.data || {};
  } catch (error) {
    console.error(`Error fetching lab ${labId} details:`, error);
    throw error;
  }
};

// Update lab
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

// Delete lab
export const deleteEveNGLab = async (labId) => {
  try {
    await eveNgApi.delete(`/labs/${labId}`);
  } catch (error) {
    console.error('Error deleting lab:', error);
    throw error;
  }
};

// Start lab
export const startEveNGLab = async (labId) => {
  try {
    const response = await eveNgApi.post(`/labs/${labId}/start`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error starting lab:', error);
    throw error;
  }
};

// Stop lab
export const stopEveNGLab = async (labId) => {
  try {
    const response = await eveNgApi.post(`/labs/${labId}/stop`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error stopping lab:', error);
    throw error;
  }
};

// ==================== DASHBOARD & MONITORING ====================

export const fetchDashboardStats = async () => {
  try {
    const clusterStatus = await fetchClusterStatus();
    return {
      total_labs: clusterStatus.total_labs || 0,
      running_labs: clusterStatus.running_labs || 0,
      active_users: clusterStatus.active_users || 0,
      disk_usage: clusterStatus.disk_usage || '0GB',
      nodes: clusterStatus.nodes || [],
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      total_labs: 0,
      running_labs: 0,
      active_users: 0,
      disk_usage: '0GB',
      nodes: [],
    };
  }
};

export const fetchActiveUsers = async () => {
  try {
    const response = await eveNgApi.get('/system/users');
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching active users:', error);
    return [];
  }
};

// ==================== LAB OPERATIONS ====================

export const fetchLabs = async (skip = 0, limit = 100) => {
  try {
    return await fetchEveNGLabs();
  } catch (error) {
    console.error('Error fetching labs:', error);
    return [];
  }
};

export const getLab = async (labId) => {
  try {
    return await fetchLabDetails(labId);
  } catch (error) {
    console.error('Error fetching lab:', error);
    throw error;
  }
};

export const updateLabStatus = async (labId, status) => {
  try {
    if (status === 'running') {
      return await startEveNGLab(labId);
    } else if (status === 'stopped') {
      return await stopEveNGLab(labId);
    }
  } catch (error) {
    console.error('Error updating lab status:', error);
    throw error;
  }
};

export const deleteLab = async (labId) => {
  try {
    return await deleteEveNGLab(labId);
  } catch (error) {
    console.error('Error deleting lab:', error);
    throw error;
  }
};

export const startLab = async (labId) => {
  try {
    return await startEveNGLab(labId);
  } catch (error) {
    console.error('Error starting lab:', error);
    throw error;
  }
};

export const stopLab = async (labId) => {
  try {
    return await stopEveNGLab(labId);
  } catch (error) {
    console.error('Error stopping lab:', error);
    throw error;
  }
};

export const createLab = async (name, description, topology) => {
  try {
    return await createEveNGLab({ name, description, topology });
  } catch (error) {
    console.error('Error creating lab:', error);
    throw error;
  }
};

// ==================== PREBUILT LAB CATEGORIES ====================

export const fetchSDWANLabs = async () => {
  try {
    const labs = await fetchEveNGLabs();
    return labs.filter((lab) => lab.name?.toLowerCase().includes('sdwan')) || [];
  } catch (error) {
    console.error('Error fetching SD-WAN labs:', error);
    return [];
  }
};

export const fetchRoutingLabs = async () => {
  try {
    const labs = await fetchEveNGLabs();
    return labs.filter((lab) => lab.name?.toLowerCase().includes('routing')) || [];
  } catch (error) {
    console.error('Error fetching Routing labs:', error);
    return [];
  }
};

export const fetchSecurityLabs = async () => {
  try {
    const labs = await fetchEveNGLabs();
    return labs.filter((lab) => lab.name?.toLowerCase().includes('security')) || [];
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

export const updateTemplate = async (templateId, templateData) => {
  try {
    const response = await api.put(`/templates/${templateId}`, templateData);
    return response.data;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

export const getTemplate = async (templateId) => {
  try {
    const response = await api.get(`/templates/${templateId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
};

export const downloadTemplate = async (templateId) => {
  try {
    const response = await api.get(`/templates/${templateId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading template:', error);
    throw error;
  }
};

export const extractTemplateArchive = async (templateId) => {
  try {
    const response = await api.post(`/templates/${templateId}/extract`);
    return response.data;
  } catch (error) {
    console.error('Error extracting template:', error);
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

export const fetchTemplates = async (category = null) => {
  try {
    const response = await api.get('/templates', {
      params: category ? { category } : {},
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
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

// ==================== DEPLOYMENTS ====================

export const fetchDeployments = async (skip = 0, limit = 100, labId = null) => {
  try {
    const response = await api.get('/deployments', {
      params: { skip, limit, lab_id: labId },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return [];
  }
};

export const getDeployment = async (deploymentId) => {
  try {
    const response = await api.get(`/deployments/${deploymentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching deployment:', error);
    throw error;
  }
};

export const deleteDeployment = async (deploymentId) => {
  try {
    await api.delete(`/deployments/${deploymentId}`);
  } catch (error) {
    console.error('Error deleting deployment:', error);
    throw error;
  }
};

// ==================== RESERVATIONS ====================

export const fetchReservations = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get('/reservations', {
      params: { skip, limit },
    });
    return response.data;
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

export const deleteReservation = async (reservationId) => {
  try {
    await api.delete(`/reservations/${reservationId}`);
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
};

// ==================== REPORTS ====================

export const generateReport = async (reportType, params) => {
  try {
    const response = await api.get(`/reports/${reportType}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

export const fetchUserActivity = async (userId, skip = 0, limit = 100) => {
  try {
    const response = await api.get(`/reports/user-activity/${userId}`, {
      params: { skip, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return [];
  }
};

export const fetchSystemLogs = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get('/reports/system-logs', {
      params: { skip, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching system logs:', error);
    return [];
  }
};

// ==================== CONFIGURATION ====================

export const fetchSystemConfig = async () => {
  try {
    const response = await api.get('/system/config');
    return response.data;
  } catch (error) {
    console.error('Error fetching system config:', error);
    throw error;
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

// ==================== HELPERS ====================

export const getServerConfig = () => ({
  ip: EVE_NG_IP,
  fqdn: EVE_NG_FQDN,
  port: EVE_NG_PORT,
  protocol: EVE_NG_PROTOCOL,
  baseUrl: API_BASE_URL,
  eveNgApiUrl: EVE_NG_API_URL,
});

export default api;
