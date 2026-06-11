const path = require('path');
const dotenv = require('dotenv');

// LOAD ENV FILES IMMEDIATELY WHEN THIS MODULE IS REQUIRED
const NODE_ENV = (process.env.NODE_ENV || 'development').trim();
const envFilesToTry = NODE_ENV === 'production' 
    ? ['.env.production.local', '.env.production', '.env']
    : ['.env.development.local', '.env.development', '.env'];

console.log('[config/env.js] Loading env files for:', NODE_ENV);
for (const envFile of envFilesToTry) {
    const envPath = path.resolve(process.cwd(), envFile);
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
        console.log(`[config/env.js] Loaded: ${envFile}`);
        break;
    }
}

let configLoaded = false;
let config = null;

function loadEnvConfig() {
  if (configLoaded) return config;

  config = {
    NODE_ENV,
    isDev: NODE_ENV === 'development',
    isProd: NODE_ENV === 'production',
    isDevelopment: NODE_ENV === 'development',
    isProduction: NODE_ENV === 'production',

    PORT: parseInt(process.env.PORT) || 3050,
    API_URL: process.env.API_URL || `http://localhost:${process.env.PORT || 3050}`,
    FRONTEND_URL: process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3050}`,

    MONGODB_URL: process.env.MONGODB_URL || process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/worldcup2026',

    JWT_SECRET: process.env.JWT_SECRET || 'worldcup2026_dev_secret_key',
    SECRET: process.env.SECRET || 'worldcup2026_secret',
    ACCESSCODEDEV: process.env.ACCESSCODEDEV || 'devcode123',

    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 500,

    CORS_ORIGINS: process.env.CORS_ORIGINS || '*',

    NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY || '',
    NOWPAYMENTS_IPN_SECRET: process.env.NOWPAYMENTS_IPN_SECRET || '',
    NOWPAYMENTS_PUBLIC_KEY: process.env.NOWPAYMENTS_PUBLIC_KEY || '',
    DONATION_WALLET_ADDRESS: process.env.DONATION_WALLET_ADDRESS || '',

    LOG_LEVEL: process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'error' : 'debug'),

    ENABLE_SWAGGER: process.env.ENABLE_SWAGGER === 'true' || NODE_ENV === 'development',

    getCorsOrigins: function() {
      const origins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '*';
      if (origins === '*') return '*';
      return origins.split(',').map(o => o.trim());
    }
  };

  configLoaded = true;
  return config;
}

module.exports = { loadEnvConfig, config: null };

Object.defineProperty(module.exports, 'config', {
  get: function() {
    if (!config) loadEnvConfig();
    return config;
  }
});
