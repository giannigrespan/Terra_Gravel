const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const oauthController = require('../controllers/oauthController');
const passwordResetController = require('../controllers/passwordResetController');
const emailVerificationController = require('../controllers/emailVerificationController');
const {
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
} = require('../middleware/validator');
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

// ==========================================
// Password Reset Routes
// ==========================================

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', authLimiter, forgotPasswordValidation, passwordResetController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authLimiter, resetPasswordValidation, passwordResetController.resetPassword);

/**
 * @route   GET /api/v1/auth/verify-reset-token/:token
 * @desc    Verify reset token is valid
 * @access  Public
 */
router.get('/verify-reset-token/:token', passwordResetController.verifyResetToken);

// ==========================================
// Email Verification Routes
// ==========================================

/**
 * @route   POST /api/v1/auth/send-verification
 * @desc    Send verification email
 * @access  Private
 */
router.post('/send-verification', authenticate, emailVerificationController.sendVerification);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post('/verify-email', verifyEmailValidation, emailVerificationController.verifyEmail);

/**
 * @route   GET /api/v1/auth/verification-status
 * @desc    Check email verification status
 * @access  Private
 */
router.get('/verification-status', authenticate, emailVerificationController.getVerificationStatus);

module.exports = router;
