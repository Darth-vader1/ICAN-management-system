import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

let rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').trim();
rawApiUrl = rawApiUrl.replace(/\.com\.\/?/, '.com/');
if (!/\/api\/?$/.test(rawApiUrl)) {
  rawApiUrl = `${rawApiUrl.replace(/\/+$/, '')}/api`;
}
const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

let inMemoryAccessToken: string | null = null;

export const setInMemoryAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

export const getInMemoryAccessToken = (): string | null => inMemoryAccessToken;

const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|.*;\s*)csrftoken\s*=\s*([^;]*).*$/);
  return match ? match[1] : null;
};

const NON_SAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const getMediaUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'None') return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  const backendHost = API_BASE_URL.replace(/\/api\/?$/, '');
  const cleanUrl = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${backendHost}${cleanUrl}`;
};

export interface ApiError {
  detail?: string;
  code?: string;
  field_errors?: Record<string, string[]>;
}

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string') {
      return data;
    }
    if (data && typeof data === 'object') {
      const apiError = data as ApiError;
      if (typeof apiError.detail === 'string') {
        return apiError.detail;
      }
      const record = data as Record<string, unknown>;
      if (typeof record.message === 'string') {
        return record.message;
      }
      if (Array.isArray(record.non_field_errors) && record.non_field_errors.length > 0) {
        return record.non_field_errors.join(', ');
      }

      const messages: string[] = [];
      for (const [key, value] of Object.entries(record)) {
        if (Array.isArray(value) && value.length > 0) {
          const fieldName = key.replace(/_/g, ' ');
          const formattedField = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
          messages.push(`${formattedField}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          messages.push(value);
        }
      }
      if (messages.length > 0) {
        return messages.join(' | ');
      }
    }
    return error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const method = (config.method || 'get').toUpperCase();
    if (inMemoryAccessToken) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    if (NON_SAFE_METHODS.has(method)) {
      const csrf = getCsrfToken();
      if (csrf) {
        config.headers['X-CSRFToken'] = csrf;
      }
    }
    // M4: Propagate X-Request-ID for end-to-end correlation
    if (!config.headers['X-Request-ID']) {
      config.headers['X-Request-ID'] =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `fe-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/password-reset');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {}, {
          withCredentials: true,
          headers: NON_SAFE_METHODS.has('POST')
            ? (() => {
                const csrf = getCsrfToken();
                return csrf ? { 'X-CSRFToken': csrf } : {};
              })()
            : {},
        });

        const { access } = response.data;
        inMemoryAccessToken = access || null;

        if (inMemoryAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        inMemoryAccessToken = null;
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

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

export default apiClient;
