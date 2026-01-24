const { query, getClient } = require('../config/database');

/**
 * Get messages for a match
 * GET /api/v1/matches/:matchId/messages
 */
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { matchId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Verify user is part of this match
    const matchCheck = await query(
      `SELECT id FROM matches
       WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2) AND status = 'ACTIVE'`,
      [matchId, userId]
    );

    if (matchCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Match not found or you are not part of this match',
      });
    }

    // Get messages
    const result = await query(
      `SELECT
        m.id,
        m.sender_id,
        m.content,
        m.created_at,
        m.read_at,
        u.username AS sender_username,
        u.avatar_url AS sender_avatar_url
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.match_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [matchId, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows.reverse(), // Return in chronological order
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get messages error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve messages',
    });
  }
};

/**
 * Send a message
 * POST /api/v1/matches/:matchId/messages
 */
const sendMessage = async (req, res) => {
  const client = await getClient();

  try {
    const userId = req.user.id;
    const { matchId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message content cannot be empty',
      });
    }

    // Verify user is part of this match
    const matchCheck = await query(
      `SELECT id FROM matches
       WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2) AND status = 'ACTIVE'`,
      [matchId, userId]
    );

    if (matchCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Match not found or you are not part of this match',
      });
    }

    await client.query('BEGIN');

    // Insert message (trigger will update last_message_at)
    const result = await client.query(
      `INSERT INTO messages (match_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, match_id, sender_id, content, created_at, read_at`,
      [matchId, userId, content.trim()]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Send message error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to send message',
    });
  } finally {
    client.release();
  }
};

/**
 * Mark messages as read
 * PUT /api/v1/matches/:matchId/messages/read
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { matchId } = req.params;

    // Verify user is part of this match
    const matchCheck = await query(
      `SELECT id FROM matches
       WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2) AND status = 'ACTIVE'`,
      [matchId, userId]
    );

    if (matchCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Match not found',
      });
    }

    // Mark all unread messages from other user as read
    await query(
      `UPDATE messages
       SET read_at = NOW()
       WHERE match_id = $1
       AND sender_id != $2
       AND read_at IS NULL`,
      [matchId, userId]
    );

    res.json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read',
    });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markAsRead,
};
