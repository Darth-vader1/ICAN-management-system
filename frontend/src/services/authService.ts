import apiClient from '../lib/api';
import type { LoginCredentials, LoginResponse, RegisterData, User } from '../types/auth';

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    return response.data;
  },

  /**
   * Register new student
   */
  async register(data: RegisterData): Promise<void> {
    await apiClient.post('/auth/register/', data);
  },

  /**
   * Get current user info
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me/');
    return response.data;
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/password-reset/', { email });
  },

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(uid: string, token: string, password: string): Promise<void> {
    await apiClient.post('/auth/password-reset/confirm/', {
      uid,
      token,
      password,
    });
  },

  /**
   * Logout (clear local storage)
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
