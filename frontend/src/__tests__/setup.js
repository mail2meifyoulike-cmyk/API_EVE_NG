# Frontend Test Setup with Jest and React Testing Library

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { LabsProvider } from '../context/LabsContext';

// Custom render function that includes providers
export function renderWithProviders(ui, options = {}) {
  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <AuthProvider>
          <LabsProvider>
            {children}
          </LabsProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock API responses
export const mockAuthAPI = {
  login: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  refreshToken: jest.fn(),
};

export const mockLabsAPI = {
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

// Setup mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});
