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
  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register/', data);
    return response.data;
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
   * Logout (invalidate tokens and clear storage)
   */
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    // Try to blacklist the refresh token on the backend
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout/', { refresh: refreshToken });
      } catch (error) {
        // Even if backend logout fails, clear local storage
        console.error('Logout error:', error);
      }
    }
    
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /**
   * Update user profile
   */
  async updateProfile(data: { first_name?: string; last_name?: string; email?: string }): Promise<User> {
    const response = await apiClient.patch<User>('/auth/me/', data);
    return response.data;
  },

  /**
   * Upload profile photo / avatar
   */
  async uploadAvatar(file: File): Promise<{ avatar_url: string; user: User }> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post<{ avatar_url: string; user: User }>(
      '/auth/profile/avatar/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Change password
   */
  async changePassword(data: { current_password: string; new_password: string }): Promise<void> {
    await apiClient.post('/auth/change-password/', data);
  },
};

export default authService;
