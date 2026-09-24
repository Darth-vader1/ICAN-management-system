import apiClient, { setInMemoryAccessToken } from '../lib/api';
import type { LoginCredentials, LoginResponse, RegisterData, User } from '../types/auth';
import { logger } from '../lib/logger';

export const authService = {
  async bootstrapCsrf(): Promise<void> {
    try {
      await apiClient.get('/auth/csrf/');
    } catch (e) {
      // Swallow — cookie is best-effort; next mutating request will fail 403
      // if csrftoken is truly required and missing, which is correct behavior.
      void e;
    }
  },

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    if (response.data?.access) {
      setInMemoryAccessToken(response.data.access);
    }
    return response.data;
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register/', data);
    if (response.data?.access) {
      setInMemoryAccessToken(response.data.access);
    }
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me/');
    return response.data;
  },

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/password-reset/', { email });
  },

  async confirmPasswordReset(uid: string, token: string, password: string): Promise<void> {
    await apiClient.post('/auth/password-reset/confirm/', {
      uid,
      token,
      password,
    });
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout/', {});
    } catch (error) {
      logger.warn('Logout error:', error);
    } finally {
      setInMemoryAccessToken(null);
    }
  },

  async updateProfile(data: { first_name?: string; last_name?: string; email?: string }): Promise<User> {
    const response = await apiClient.patch<User>('/auth/me/', data);
    return response.data;
  },

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

  async changePassword(data: { current_password: string; new_password: string }): Promise<void> {
    await apiClient.post('/auth/change-password/', data);
  },
};

export default authService;
