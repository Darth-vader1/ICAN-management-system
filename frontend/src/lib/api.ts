import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface ApiError {
  detail?: string;
  code?: string;
  field_errors?: Record<string, string[]>;
}

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;
    return apiError?.detail || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Try to refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Auto-toast server errors and unhandled client errors
    const status = error.response?.status;
    if (status && status >= 500) {
      const apiError = error.response?.data as ApiError | undefined;
      toast.error(
        apiError?.detail ||
          'A server error occurred. Please try again or contact support.'
      );
    } else if (
      status &&
      status === 403 &&
      !originalRequest._silent &&
      !originalRequest.url?.includes('/auth/')
    ) {
      toast.error('You do not have permission to perform this action.');
    } else if (
      status &&
      status === 400 &&
      !originalRequest._silent &&
      (originalRequest.method?.toUpperCase() === 'POST' ||
        originalRequest.method?.toUpperCase() === 'PATCH' ||
        originalRequest.method?.toUpperCase() === 'PUT')
    ) {
      const apiError = error.response?.data as ApiError | undefined;
      if (apiError?.detail && !apiError.field_errors) {
        toast.error(apiError.detail);
      }
    }

    return Promise.reject(error);
  }
);

// Export for use in API services
export default apiClient;
