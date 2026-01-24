const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/v1/matches/:matchId/messages
 * @desc    Get messages for a match
 * @access  Private
 */
router.get('/:matchId/messages', authenticate, messageController.getMessages);

/**
 * @route   POST /api/v1/matches/:matchId/messages
 * @desc    Send a message
 * @access  Private
 */
router.post('/:matchId/messages', authenticate, messageController.sendMessage);

/**
 * @route   PUT /api/v1/matches/:matchId/messages/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.put('/:matchId/messages/read', authenticate, messageController.markAsRead);

module.exports = router;
