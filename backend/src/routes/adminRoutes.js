const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');

// All admin routes require authentication + admin status
router.use(authenticate, isAdmin);

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get dashboard statistics
 * @access  Admin
 */
router.get('/stats', adminController.getDashboardStats);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users (paginated)
 * @access  Admin
 */
router.get('/users', adminController.getUsers);

/**
 * @route   GET /api/v1/admin/users/:userId
 * @desc    Get user details
 * @access  Admin
 */
router.get('/users/:userId', adminController.getUserDetails);

/**
 * @route   PUT /api/v1/admin/users/:userId/ban
 * @desc    Ban a user
 * @access  Admin
 */
router.put('/users/:userId/ban', adminController.banUser);

/**
 * @route   PUT /api/v1/admin/users/:userId/unban
 * @desc    Unban a user
 * @access  Admin
 */
router.put('/users/:userId/unban', adminController.unbanUser);

/**
 * @route   PUT /api/v1/admin/users/:userId/make-admin
 * @desc    Make a user admin
 * @access  Admin
 */
router.put('/users/:userId/make-admin', adminController.makeAdmin);

/**
 * @route   GET /api/v1/admin/reports
 * @desc    Get all user reports (paginated)
 * @access  Admin
 */
router.get('/reports', adminController.getReports);

/**
 * @route   PUT /api/v1/admin/reports/:reportId
 * @desc    Update report status
 * @access  Admin
 */
router.put('/reports/:reportId', adminController.updateReport);

module.exports = router;
