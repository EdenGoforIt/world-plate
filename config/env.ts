import Constants from 'expo-constants';

interface Config {
  API_BASE_URL: string;
  API_VERSION: string;
  API_TIMEOUT: number;
  AUTH_DOMAIN: string;
  AUTH_CLIENT_ID: string;
  AUTH_REDIRECT_URI: string;
  ENABLE_ANALYTICS: boolean;
  ENABLE_CRASH_REPORTING: boolean;
  ENABLE_PUSH_NOTIFICATIONS: boolean;
  SENTRY_DSN: string;
  GOOGLE_MAPS_API_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  DEBUG_MODE: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  MOCK_API: boolean;
}

const getEnvVars = (): Config => {
  const isProduction = Constants.expoConfig?.extra?.isProduction || false;
  const isDevelopment = __DEV__;

  // Default development configuration
  const defaultConfig: Config = {
    API_BASE_URL: 'http://localhost:3000',
    API_VERSION: 'v1',
    API_TIMEOUT: 30000,
    AUTH_DOMAIN: 'localhost:3000',
    AUTH_CLIENT_ID: 'dev_client_id',
    AUTH_REDIRECT_URI: 'worldplate://auth',
    ENABLE_ANALYTICS: false,
    ENABLE_CRASH_REPORTING: false,
    ENABLE_PUSH_NOTIFICATIONS: false,
    SENTRY_DSN: '',
    GOOGLE_MAPS_API_KEY: '',
    STRIPE_PUBLISHABLE_KEY: '',
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug',
    MOCK_API: true,
  };

  // Production configuration
  const productionConfig: Config = {
    API_BASE_URL: process.env.API_BASE_URL || 'https://api.worldplate.com',
    API_VERSION: process.env.API_VERSION || 'v1',
    API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000'),
    AUTH_DOMAIN: process.env.AUTH_DOMAIN || 'auth.worldplate.com',
    AUTH_CLIENT_ID: process.env.AUTH_CLIENT_ID || '',
    AUTH_REDIRECT_URI: process.env.AUTH_REDIRECT_URI || 'worldplate://auth',
    ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
    ENABLE_CRASH_REPORTING: process.env.ENABLE_CRASH_REPORTING === 'true',
    ENABLE_PUSH_NOTIFICATIONS: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
    SENTRY_DSN: process.env.SENTRY_DSN || '',
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
    DEBUG_MODE: false,
    LOG_LEVEL: 'error',
    MOCK_API: false,
  };

  // Override with Expo constants if available
  const expoExtra = Constants.expoConfig?.extra || {};
  const config = isProduction ? productionConfig : defaultConfig;

  return {
    ...config,
    ...expoExtra,
  };
};

export const ENV = getEnvVars();

// Type-safe environment variable access
export const getApiUrl = (endpoint: string) => {
  return `${ENV.API_BASE_URL}/${ENV.API_VERSION}/${endpoint}`;
};

// Logger utility that respects LOG_LEVEL
export const logger = {
  debug: (...args: any[]) => {
    if (ENV.LOG_LEVEL === 'debug') console.log('[DEBUG]', ...args);
  },
  info: (...args: any[]) => {
    if (['debug', 'info'].includes(ENV.LOG_LEVEL)) console.info('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    if (['debug', 'info', 'warn'].includes(ENV.LOG_LEVEL)) console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};