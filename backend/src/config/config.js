require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Rate Limiting
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // 100 requests per window
  swipeRateLimitMax: 200, // 200 swipes per day
  feedbackRateLimitMax: 10, // 10 feedback submissions per day

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // File Upload
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],

  // Matching Algorithm
  defaultMaxDistanceKm: 20,
  maxStackSize: 50,

  // Location Privacy
  locationPrecision: 0.01, // ~1km
};

module.exports = config;
