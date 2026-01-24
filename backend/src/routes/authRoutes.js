const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const oauthController = require('../controllers/oauthController');
const { signupValidation, loginValidation } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * @route   POST /api/v1/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', authLimiter, signupValidation, authController.signup);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, loginValidation, authController.login);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/v1/auth/google
 * @desc    Sign in with Google
 * @access  Public
 */
router.post('/google', authLimiter, oauthController.googleSignIn);

/**
 * @route   POST /api/v1/auth/strava
 * @desc    Connect or sign in with Strava
 * @access  Public/Private (optionalAuth)
 */
router.post('/strava', authLimiter, optionalAuth, oauthController.stravaConnect);

/**
 * @route   POST /api/v1/auth/disconnect/:provider
 * @desc    Disconnect social provider (google, strava)
 * @access  Private
 */
router.post('/disconnect/:provider', authenticate, oauthController.disconnectProvider);

module.exports = router;
