// Authentication endpoints
import apiClient from './client';

export const authAPI = {
  login: (username, password) =>
    apiClient.post('/auth/login', { username, password }),
  
  logout: () =>
    apiClient.post('/auth/logout'),
  
  refreshToken: (refreshToken) =>
    apiClient.post('/auth/refresh', { refresh_token: refreshToken }),
  
  getCurrentUser: () =>
    apiClient.get('/auth/me'),
};