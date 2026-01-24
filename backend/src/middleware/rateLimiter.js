const rateLimit = require('express-rate-limit');
const config = require('../config/config');

/**
 * General API rate limiter
 * Limits all requests to prevent abuse
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth endpoints rate limiter
 * Stricter limit for login/signup to prevent brute force
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Swipe rate limiter
 * Limits swipes per user per day
 */
const swipeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: config.swipeRateLimitMax,
  message: {
    success: false,
    error: 'Daily swipe limit reached. Please try again tomorrow.',
  },
  keyGenerator: (req) => req.user?.id || req.ip, // Rate limit by user ID
});

/**
 * Feedback rate limiter
 * Limits feedback submissions per user per day
 */
const feedbackLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: config.feedbackRateLimitMax,
  message: {
    success: false,
    error: 'Daily feedback submission limit reached.',
  },
  keyGenerator: (req) => req.user?.id || req.ip,
});

module.exports = {
  generalLimiter,
  authLimiter,
  swipeLimiter,
  feedbackLimiter,
};
