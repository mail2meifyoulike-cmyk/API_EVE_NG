// Lab endpoints
import apiClient from './client';

export const labsAPI = {
  getAll: () =>
    apiClient.get('/labs'),
  
  getById: (id) =>
    apiClient.get(`/labs/${id}`),
  
  create: (labData) =>
    apiClient.post('/labs', labData),
  
  update: (id, labData) =>
    apiClient.put(`/labs/${id}`, labData),
  
  delete: (id) =>
    apiClient.delete(`/labs/${id}`),
  
  start: (id) =>
    apiClient.post(`/labs/${id}/start`),
  
  stop: (id) =>
    apiClient.post(`/labs/${id}/stop`),
};