const express = require('express');
const router = express.Router();
const rideMatchController = require('../controllers/rideMatchController');
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');
const { swipeValidation, feedbackValidation } = require('../middleware/validator');
const { swipeLimiter, feedbackLimiter } = require('../middleware/rateLimiter');

/**
 * @route   GET /api/v1/ridematch/stack
 * @desc    Get stack of potential matches
 * @access  Private
 */
router.get('/stack', authenticate, rideMatchController.getStack);

/**
 * @route   POST /api/v1/ridematch/swipe
 * @desc    Swipe on a user
 * @access  Private
 */
router.post('/swipe', authenticate, swipeLimiter, swipeValidation, rideMatchController.swipe);

/**
 * @route   GET /api/v1/ridematch/matches
 * @desc    Get user's matches
 * @access  Private
 */
router.get('/matches', authenticate, rideMatchController.getMatches);

/**
 * @route   POST /api/v1/ridematch/unmatch
 * @desc    Unmatch a user
 * @access  Private
 */
router.post('/unmatch', authenticate, rideMatchController.unmatch);

/**
 * @route   POST /api/v1/ridematch/feedback
 * @desc    Submit ride feedback
 * @access  Private
 */
router.post('/feedback', authenticate, feedbackLimiter, feedbackValidation, feedbackController.submitFeedback);

module.exports = router;
