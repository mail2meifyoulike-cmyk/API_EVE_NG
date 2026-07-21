// Network endpoints
import apiClient from './client';

export const networksAPI = {
  getAll: (labId) =>
    apiClient.get(`/labs/${labId}/networks`),
  
  getById: (labId, networkId) =>
    apiClient.get(`/labs/${labId}/networks/${networkId}`),
  
  create: (labId, networkData) =>
    apiClient.post(`/labs/${labId}/networks`, networkData),
  
  update: (labId, networkId, networkData) =>
    apiClient.put(`/labs/${labId}/networks/${networkId}`, networkData),
  
  delete: (labId, networkId) =>
    apiClient.delete(`/labs/${labId}/networks/${networkId}`),
};