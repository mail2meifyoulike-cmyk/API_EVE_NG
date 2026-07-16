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

// Labs
export const fetchLabs = async (skip = 0, limit = 100) => {
  const response = await api.get('/labs', {
    params: { skip, limit },
  });
  return response.data;
};

export const createLab = async (name, description) => {
  const response = await api.post('/labs', {
    name,
    description,
  });
  return response.data;
};

export const getLab = async (labId) => {
  const response = await api.get(`/labs/${labId}`);
  return response.data;
};

export const updateLabStatus = async (labId, status) => {
  const response = await api.put(`/labs/${labId}`, {
    status,
  });
  return response.data;
};

export const deleteLab = async (labId) => {
  await api.delete(`/labs/${labId}`);
};

// Deployments
export const fetchDeployments = async (skip = 0, limit = 100, labId) => {
  const response = await api.get('/deployments', {
    params: { skip, limit, lab_id: labId },
  });
  return response.data;
};

export const createDeployment = async (
  labId,
  deploymentName,
  topology,
  provisioningTime
) => {
  const response = await api.post('/deployments', {
    lab_id: labId,
    deployment_name: deploymentName,
    topology,
    provisioning_time: provisioningTime,
  });
  return response.data;
};

export const updateDeploymentStatus = async (deploymentId, status) => {
  const response = await api.put(`/deployments/${deploymentId}/status`, null, {
    params: { status },
  });
  return response.data;
};

export const deleteDeployment = async (deploymentId) => {
  await api.delete(`/deployments/${deploymentId}`);
};
