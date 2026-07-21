// Node endpoints
import apiClient from './client';

export const nodesAPI = {
  getAll: (labId) =>
    apiClient.get(`/labs/${labId}/nodes`),
  
  getById: (labId, nodeId) =>
    apiClient.get(`/labs/${labId}/nodes/${nodeId}`),
  
  create: (labId, nodeData) =>
    apiClient.post(`/labs/${labId}/nodes`, nodeData),
  
  update: (labId, nodeId, nodeData) =>
    apiClient.put(`/labs/${labId}/nodes/${nodeId}`, nodeData),
  
  delete: (labId, nodeId) =>
    apiClient.delete(`/labs/${labId}/nodes/${nodeId}`),
  
  start: (labId, nodeId) =>
    apiClient.post(`/labs/${labId}/nodes/${nodeId}/start`),
  
  stop: (labId, nodeId) =>
    apiClient.post(`/labs/${labId}/nodes/${nodeId}/stop`),
};