const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/v1/feed
 * @desc    Get activity feed
 * @access  Private
 */
router.get('/', authenticate, activityController.getFeed);

/**
 * @route   PUT /api/v1/feed/read
 * @desc    Mark activities as read
 * @access  Private
 */
router.put('/read', authenticate, activityController.markAsRead);

/**
 * @route   GET /api/v1/feed/unread-count
 * @desc    Get unread count
 * @access  Private
 */
router.get('/unread-count', authenticate, activityController.getUnreadCount);

/**
 * @route   DELETE /api/v1/feed/:activityId
 * @desc    Delete activity
 * @access  Private
 */
router.delete('/:activityId', authenticate, activityController.deleteActivity);

module.exports = router;
