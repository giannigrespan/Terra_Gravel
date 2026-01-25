const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const blockReportController = require('../controllers/blockReportController');
const statisticsController = require('../controllers/statisticsController');
const searchController = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');
const { locationValidation, reportUserValidation } = require('../middleware/validator');

// ==========================================
// Current User Routes
// ==========================================

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, userController.getMe);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch('/me', authenticate, userController.updateMe);

/**
 * @route   PUT /api/v1/users/me/location
 * @desc    Update user location
 * @access  Private
 */
router.put('/me/location', authenticate, locationValidation, userController.updateLocation);

/**
 * @route   DELETE /api/v1/users/me
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete('/me', authenticate, userController.deleteMe);

/**
 * @route   GET /api/v1/users/me/statistics
 * @desc    Get current user statistics
 * @access  Private
 */
router.get('/me/statistics', authenticate, statisticsController.getMyStatistics);

/**
 * @route   GET /api/v1/users/me/reports
 * @desc    Get my submitted reports
 * @access  Private
 */
router.get('/me/reports', authenticate, blockReportController.getMyReports);

// ==========================================
// Search Routes
// ==========================================

/**
 * @route   GET /api/v1/users/search
 * @desc    Search users by username
 * @access  Private
 */
router.get('/search', authenticate, searchController.searchUsers);

// ==========================================
// Blocked Users Routes
// ==========================================

/**
 * @route   GET /api/v1/users/blocked
 * @desc    Get blocked users list
 * @access  Private
 */
router.get('/blocked', authenticate, blockReportController.getBlockedUsers);

// ==========================================
// User by Username Routes
// ==========================================

/**
 * @route   GET /api/v1/users/username/:username
 * @desc    Get user profile by username
 * @access  Private
 */
router.get('/username/:username', authenticate, searchController.getUserByUsername);

// ==========================================
// User by ID Routes
// ==========================================

/**
 * @route   GET /api/v1/users/:userId/statistics
 * @desc    Get user public statistics
 * @access  Private
 */
router.get('/:userId/statistics', authenticate, statisticsController.getUserStatistics);

/**
 * @route   POST /api/v1/users/:userId/block
 * @desc    Block a user
 * @access  Private
 */
router.post('/:userId/block', authenticate, blockReportController.blockUser);

/**
 * @route   DELETE /api/v1/users/:userId/block
 * @desc    Unblock a user
 * @access  Private
 */
router.delete('/:userId/block', authenticate, blockReportController.unblockUser);

/**
 * @route   POST /api/v1/users/:userId/report
 * @desc    Report a user
 * @access  Private
 */
router.post('/:userId/report', authenticate, reportUserValidation, blockReportController.reportUser);

module.exports = router;
