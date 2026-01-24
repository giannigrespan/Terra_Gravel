const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { locationValidation } = require('../middleware/validator');

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

module.exports = router;
