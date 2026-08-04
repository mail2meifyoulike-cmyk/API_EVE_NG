# Frontend Authentication Tests

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthContext } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import * as authAPI from '../api/auth';

jest.mock('../api/auth');

describe('Authentication', () => {
  describe('useAuth Hook', () => {
    it('should initialize with no user', () => {
      const { result } = renderHook(() => useAuthContext());
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBeFalsy();
    });

    it('should login successfully', async () => {
      authAPI.login.mockResolvedValue({
        data: {
          access_token: 'test-token',
          user: { id: 1, username: 'testuser' }
        }
      });

      const { result } = renderHook(() => useAuthContext());
      
      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      expect(result.current.user).toEqual({ id: 1, username: 'testuser' });
      expect(localStorage.getItem('access_token')).toBe('test-token');
    });

    it('should handle login error', async () => {
      authAPI.login.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuthContext());
      
      await act(async () => {
        try {
          await result.current.login('testuser', 'wrongpassword');
        } catch (err) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.user).toBeNull();
    });

    it('should logout successfully', async () => {
      authAPI.logout.mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useAuthContext());
      
      // Set initial state
      act(() => {
        localStorage.setItem('access_token', 'test-token');
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('LoginPage Component', () => {
    it('should render login form', () => {
      render(<LoginPage />, { wrapper: BrowserRouter });
      
      expect(screen.getByText('EVE Lab Automation')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should submit form with credentials', async () => {
      authAPI.login.mockResolvedValue({
        data: {
          access_token: 'test-token',
          user: { id: 1, username: 'testuser' }
        }
      });

      const user = userEvent.setup();
      render(<LoginPage />, { wrapper: BrowserRouter });
      
      await user.type(screen.getByPlaceholderText('Enter username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter password'), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith('testuser', 'password123');
      });
    });

    it('should display error message on login failure', async () => {
      authAPI.login.mockRejectedValue(new Error('Invalid credentials'));

      const user = userEvent.setup();
      render(<LoginPage />, { wrapper: BrowserRouter });
      
      await user.type(screen.getByPlaceholderText('Enter username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter password'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });
});
