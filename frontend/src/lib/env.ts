/**
 * Environment Configuration Helper
 * Type-safe access to environment variables with defaults
 */

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return import.meta.env[key] || defaultValue;
};

const getEnvBool = (key: string, defaultValue: boolean = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1' || value === true;
};

const getEnvNumber = (key: string, defaultValue: number = 0): number => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const env = {
  // API Configuration
  apiUrl: getEnvVar('VITE_API_URL', 'http://localhost:8000'),
  apiTimeout: getEnvNumber('VITE_API_TIMEOUT', 30000),
  apiDebug: getEnvBool('VITE_API_DEBUG', false),

  // Authentication
  tokenRefreshInterval: getEnvNumber('VITE_TOKEN_REFRESH_INTERVAL', 5),
  sessionTimeoutWarning: getEnvNumber('VITE_SESSION_TIMEOUT_WARNING', 5),

  // Paystack
  paystackPublicKey: getEnvVar('VITE_PAYSTACK_PUBLIC_KEY', ''),
  paymentSuccessUrl: getEnvVar('VITE_PAYMENT_SUCCESS_URL', '/payment/success'),
  paymentFailureUrl: getEnvVar('VITE_PAYMENT_FAILURE_URL', '/payment/failure'),

  // Feature Flags
  features: {
    reports: getEnvBool('VITE_ENABLE_REPORTS', true),
    payments: getEnvBool('VITE_ENABLE_PAYMENTS', true),
    notifications: getEnvBool('VITE_ENABLE_NOTIFICATIONS', true),
    attendance: getEnvBool('VITE_ENABLE_ATTENDANCE', true),
    messaging: getEnvBool('VITE_ENABLE_MESSAGING', false),
    documentUpload: getEnvBool('VITE_ENABLE_DOCUMENT_UPLOAD', false),
  },

  // Application Settings
  app: {
    name: getEnvVar('VITE_APP_NAME', 'ICAN Tutorial Centre'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    env: getEnvVar('VITE_APP_ENV', 'development'),
  },

  // Localization
  locale: getEnvVar('VITE_DEFAULT_LOCALE', 'en-NG'),
  currency: {
    code: getEnvVar('VITE_CURRENCY_CODE', 'NGN'),
    symbol: getEnvVar('VITE_CURRENCY_SYMBOL', '₦'),
  },
  dateFormat: getEnvVar('VITE_DATE_FORMAT', 'dd/MM/yyyy'),
  timeZone: getEnvVar('VITE_TIME_ZONE', 'Africa/Lagos'),

  // Developer Experience
  enableMSW: getEnvBool('VITE_ENABLE_MSW', false),
  enableReactQueryDevtools: getEnvBool('VITE_ENABLE_REACT_QUERY_DEVTOOLS', true),
  enablePerformanceMonitoring: getEnvBool('VITE_ENABLE_PERFORMANCE_MONITORING', false),

  // File Uploads
  maxFileSize: getEnvNumber('VITE_MAX_FILE_SIZE', 10485760), // 10MB
  allowedFileExtensions: getEnvVar('VITE_ALLOWED_FILE_EXTENSIONS', '.jpg,.jpeg,.png,.pdf,.doc,.docx')
    .split(',')
    .map(ext => ext.trim()),

  // UI/UX
  defaultPageSize: getEnvNumber('VITE_DEFAULT_PAGE_SIZE', 20),
  toastDuration: getEnvNumber('VITE_TOAST_DURATION', 4000),
  searchDebounce: getEnvNumber('VITE_SEARCH_DEBOUNCE', 300),
  autoSaveInterval: getEnvNumber('VITE_AUTO_SAVE_INTERVAL', 0),
  enableAnimations: getEnvBool('VITE_ENABLE_ANIMATIONS', true),

  // Analytics & Monitoring
  gaTrackingId: getEnvVar('VITE_GA_TRACKING_ID', ''),
  sentryDsn: getEnvVar('VITE_SENTRY_DSN', ''),
  logRocketAppId: getEnvVar('VITE_LOGROCKET_APP_ID', ''),

  // External Services
  whatsappPhoneNumber: getEnvVar('VITE_WHATSAPP_PHONE_NUMBER', ''),
  supportEmail: getEnvVar('VITE_SUPPORT_EMAIL', 'support@icantutorial.com'),
  supportPhone: getEnvVar('VITE_SUPPORT_PHONE', '+234-XXX-XXX-XXXX'),

  // Environment Checks
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

// Validate required environment variables
export const validateEnv = (): string[] => {
  const errors: string[] = [];

  if (!env.apiUrl) {
    errors.push('VITE_API_URL is required');
  }

  if (env.features.payments && !env.paystackPublicKey) {
    errors.push('VITE_PAYSTACK_PUBLIC_KEY is required when payments are enabled');
  }

  if (env.apiUrl && !env.apiUrl.startsWith('http')) {
    errors.push('VITE_API_URL must start with http:// or https://');
  }

  return errors;
};

// Log environment info in development if debugging enabled
if (env.isDevelopment && env.apiDebug && typeof console !== 'undefined') {
  console.group('🔧 Environment Configuration');
  console.log('Mode:', env.mode);
  console.log('API URL:', env.apiUrl);
  console.log('Features:', env.features);
  console.log('MSW Enabled:', env.enableMSW);
  console.groupEnd();
}

// Validate on load
const envErrors = validateEnv();
if (envErrors.length > 0) {
  if (typeof console !== 'undefined') {
    console.error('❌ Environment validation errors:', envErrors);
  }
  if (env.isProduction) {
    throw new Error(`Environment validation failed: ${envErrors.join(', ')}`);
  }
}

