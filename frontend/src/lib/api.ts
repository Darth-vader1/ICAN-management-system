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

    if (import.meta.env.DEV) {
      console.log(`📡 [API ${method}] ${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const csrf = getCsrfToken();
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh/`,
        {},
        {
          withCredentials: true,
          headers: csrf ? { 'X-CSRFToken': csrf } : {},
        }
      );

      const access = response.data?.access || null;
      inMemoryAccessToken = access;
      return access;
    } catch (err) {
      inMemoryAccessToken = null;
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ [API ${response.config.method?.toUpperCase()}] ${response.config.url} (${response.status})`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (import.meta.env.DEV && originalRequest) {
      console.warn(
        `⚠️ [API ${originalRequest.method?.toUpperCase()}] ${originalRequest.url} (${error.response?.status || 'Network Error'})`,
        error.response?.data || error.message
      );
    }

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/logout') ||
      originalRequest?.url?.includes('/auth/csrf') ||
      originalRequest?.url?.includes('/auth/password-reset');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const newAccess = await refreshAccessToken();
        if (!newAccess) {
          throw new Error('No access token returned from refresh');
        }
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        inMemoryAccessToken = null;

        // Never redirect if already on an auth / public page (prevents infinite reload loops)
        const publicPaths = ['/login', '/register', '/password-reset', '/privacy', '/terms'];
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const isPublicPath = publicPaths.some(
          (p) => currentPath === p || currentPath.startsWith('/password-reset')
        );

        if (!isPublicPath && currentPath !== '' && typeof window !== 'undefined') {
          window.location.href = '/login';
        }
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
