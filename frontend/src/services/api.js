import axios from 'axios';

// EVE-NG Server Configuration
const EVE_NG_IP = process.env.REACT_APP_EVE_NG_IP || '192.168.2.11';
const EVE_NG_FQDN = process.env.REACT_APP_EVE_NG_FQDN || 'evengvlab4you.ddns.net';
const EVE_NG_PORT = process.env.REACT_APP_EVE_NG_PORT || '8080';
const EVE_NG_PROTOCOL = process.env.REACT_APP_EVE_NG_PROTOCOL || 'http';

// API Base URLs
const API_BASE_URL = process.env.REACT_APP_API_URL || `${EVE_NG_PROTOCOL}://${EVE_NG_IP}:${EVE_NG_PORT}`;
const API_PREFIX = process.env.REACT_APP_API_BASE_URL || '/api/v0';

const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eve_ng_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// EVE-NG Authentication
export const loginToEveNG = async (username, password) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      { username, password },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (response.data.token) {
      localStorage.setItem('eve_ng_token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logoutFromEveNG = () => {
  localStorage.removeItem('eve_ng_token');
};

// Dashboard & Status
export const fetchDashboardStats = async () => {
  try {
    const response = await api.get('/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const fetchClusterStatus = async () => {
  try {
    const response = await api.get('/cluster/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching cluster status:', error);
    throw error;
  }
};

export const fetchActiveUsers = async () => {
  try {
    const response = await api.get('/users/active');
    return response.data;
  } catch (error) {
    console.error('Error fetching active users:', error);
    throw error;
  }
};

// Labs Management
export const fetchLabs = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get('/labs', {
      params: { skip, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching labs:', error);
    throw error;
  }
};

export const fetchPrebuiltLabs = async (category) => {
  try {
    const response = await api.get('/labs/prebuilt', {
      params: { category },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching prebuilt labs:', error);
    throw error;
  }
};

export const createLab = async (name, description, template) => {
  try {
    const response = await api.post('/labs', {
      name,
      description,
      template,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating lab:', error);
    throw error;
  }
};

export const getLab = async (labId) => {
  try {
    const response = await api.get(`/labs/${labId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching lab:', error);
    throw error;
  }
};

export const updateLabStatus = async (labId, status) => {
  try {
    const response = await api.put(`/labs/${labId}`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating lab status:', error);
    throw error;
  }
};

export const deleteLab = async (labId) => {
  try {
    await api.delete(`/labs/${labId}`);
  } catch (error) {
    console.error('Error deleting lab:', error);
    throw error;
  }
};

export const startLab = async (labId) => {
  try {
    const response = await api.post(`/labs/${labId}/start`);
    return response.data;
  } catch (error) {
    console.error('Error starting lab:', error);
    throw error;
  }
};

export const stopLab = async (labId) => {
  try {
    const response = await api.post(`/labs/${labId}/stop`);
    return response.data;
  } catch (error) {
    console.error('Error stopping lab:', error);
    throw error;
  }
};

// Prebuilt Lab Categories
export const fetchSDWANLabs = async () => {
  try {
    const response = await api.get('/labs/prebuilt/sdwan');
    return response.data;
  } catch (error) {
    console.error('Error fetching SD-WAN labs:', error);
    throw error;
  }
};

export const fetchRoutingLabs = async () => {
  try {
    const response = await api.get('/labs/prebuilt/routing');
    return response.data;
  } catch (error) {
    console.error('Error fetching Routing labs:', error);
    throw error;
  }
};

export const fetchSecurityLabs = async () => {
  try {
    const response = await api.get('/labs/prebuilt/security');
    return response.data;
  } catch (error) {
    console.error('Error fetching Security labs:', error);
    throw error;
  }
};

// User Management
export const fetchUsers = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get('/users', {
      params: { skip, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
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

// Monitoring
export const fetchLabMetrics = async (labId, timeRange = '1h') => {
  try {
    const response = await api.get(`/monitoring/labs/${labId}/metrics`, {
      params: { timeRange },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching lab metrics:', error);
    throw error;
  }
};

export const fetchNodeStatus = async (labId, nodeId) => {
  try {
    const response = await api.get(`/monitoring/labs/${labId}/nodes/${nodeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching node status:', error);
    throw error;
  }
};

// Reservations
export const fetchReservations = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get('/reservations', {
      params: { skip, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
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

// Reports
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
    throw error;
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
    throw error;
  }
};

// Configuration
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

// Export server configuration for reference
export const getServerConfig = () => ({
  ip: EVE_NG_IP,
  fqdn: EVE_NG_FQDN,
  port: EVE_NG_PORT,
  protocol: EVE_NG_PROTOCOL,
  baseUrl: API_BASE_URL,
});

export default api;
