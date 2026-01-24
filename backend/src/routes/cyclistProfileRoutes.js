const express = require('express');
const router = express.Router();
const cyclistProfileController = require('../controllers/cyclistProfileController');
const { authenticate } = require('../middleware/auth');
const { cyclistProfileValidation } = require('../middleware/validator');

/**
 * @route   GET /api/v1/cyclist-profile
 * @desc    Get cyclist profile
 * @access  Private
 */
router.get('/', authenticate, cyclistProfileController.getProfile);

/**
 * @route   PUT /api/v1/cyclist-profile
 * @desc    Update cyclist profile
 * @access  Private
 */
router.put('/', authenticate, cyclistProfileValidation, cyclistProfileController.updateProfile);

/**
 * @route   GET /api/v1/cyclist-profile/recent-rides
 * @desc    Get recent rides
 * @access  Private
 */
router.get('/recent-rides', authenticate, cyclistProfileController.getRecentRides);

/**
 * @route   POST /api/v1/cyclist-profile/recent-rides
 * @desc    Add a recent ride
 * @access  Private
 */
router.post('/recent-rides', authenticate, cyclistProfileController.addRecentRide);

module.exports = router;
