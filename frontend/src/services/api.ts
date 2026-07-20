import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_PREFIX = process.env.REACT_APP_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard
export const fetchDashboardStats = async () => {
  const response = await api.get('/status/dashboard');
  return response.data;
};

// ===== LABS =====

export const fetchLabs = async (skip = 0, limit = 100, status?: string) => {
  const params: any = { skip, limit };
  if (status) {
    params.status = status;
  }
  const response = await api.get('/labs', { params });
  return response.data;
};

export const createLab = async (name: string, description: string, templateId?: string) => {
  const payload: any = {
    name,
    description,
  };
  if (templateId) {
    payload.template_id = templateId;
  }
  const response = await api.post('/labs', payload);
  return response.data;
};

export const getLab = async (labId: number) => {
  const response = await api.get(`/labs/${labId}`);
  return response.data;
};

export const getLabStatus = async (labId: number) => {
  const response = await api.get(`/labs/${labId}/status`);
  return response.data;
};

export const getLabNodes = async (labId: number) => {
  const response = await api.get(`/labs/${labId}/nodes`);
  return response.data;
};

export const updateLabStatus = async (labId: number, status: string) => {
  const response = await api.put(`/labs/${labId}`, {
    status,
  });
  return response.data;
};

export const deleteLab = async (labId: number) => {
  await api.delete(`/labs/${labId}`);
};

export const startLab = async (labId: number) => {
  const response = await api.post(`/labs/${labId}/start`);
  return response.data;
};

export const stopLab = async (labId: number) => {
  const response = await api.post(`/labs/${labId}/stop`);
  return response.data;
};

export const uploadLabFile = async (labId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  // Create a new axios instance for multipart form data
  const uploadApi = axios.create({
    baseURL: `${API_BASE_URL}${API_PREFIX}`,
  });

  const response = await uploadApi.post(`/labs/${labId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ===== LAB TEMPLATES =====

export const fetchLabTemplates = async () => {
  const response = await api.get('/labs/templates');
  return response.data;
};

export const getTemplateDevices = async (templateId: string) => {
  const response = await api.get(`/labs/templates/${templateId}/devices`);
  return response.data;
};

// ===== DEPLOYMENTS =====

export const fetchDeployments = async (skip = 0, limit = 100, labId?: number) => {
  const response = await api.get('/deployments', {
    params: { skip, limit, lab_id: labId },
  });
  return response.data;
};

export const createDeployment = async (
  labId: number,
  deploymentName: string,
  topology?: string,
  provisioningTime?: number
) => {
  const response = await api.post('/deployments', {
    lab_id: labId,
    deployment_name: deploymentName,
    topology,
    provisioning_time: provisioningTime,
  });
  return response.data;
};

export const updateDeploymentStatus = async (deploymentId: number, status: string) => {
  const response = await api.put(`/deployments/${deploymentId}/status`, null, {
    params: { status },
  });
  return response.data;
};

export const deleteDeployment = async (deploymentId: number) => {
  await api.delete(`/deployments/${deploymentId}`);
};

// ===== ERROR HANDLING =====

export const handleApiError = (error: any): string => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.status === 503) {
    return 'EVE-NG server is not connected. Please check your configuration.';
  }
  if (error.response?.status === 404) {
    return 'Resource not found.';
  }
  if (error.response?.status === 400) {
    return 'Invalid request. Please check your input.';
  }
  return error.message || 'An error occurred. Please try again.';
};
