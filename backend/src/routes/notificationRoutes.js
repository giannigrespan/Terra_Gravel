const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const registerDeviceValidation = [
  body('token')
    .notEmpty()
    .withMessage('Device token is required'),
  body('platform')
    .isIn(['IOS', 'ANDROID', 'WEB'])
    .withMessage('Invalid platform'),
  body('deviceName')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Device name too long'),
];

/**
 * @route   GET /api/v1/notifications
 * @desc    Get notifications
 * @access  Private
 */
router.get('/', authenticate, notificationController.getNotifications);

/**
 * @route   PUT /api/v1/notifications/read
 * @desc    Mark notifications as read
 * @access  Private
 */
router.put('/read', authenticate, notificationController.markNotificationsRead);

/**
 * @route   POST /api/v1/notifications/devices
 * @desc    Register device for push notifications
 * @access  Private
 */
router.post('/devices', authenticate, registerDeviceValidation, notificationController.registerDevice);

/**
 * @route   GET /api/v1/notifications/devices
 * @desc    Get registered devices
 * @access  Private
 */
router.get('/devices', authenticate, notificationController.getDevices);

/**
 * @route   DELETE /api/v1/notifications/devices/:token
 * @desc    Unregister device
 * @access  Private
 */
router.delete('/devices/:token', authenticate, notificationController.unregisterDevice);

module.exports = router;
