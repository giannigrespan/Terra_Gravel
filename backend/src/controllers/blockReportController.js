const { query } = require('../config/database');

/**
 * Block a user
 * POST /api/v1/users/:userId/block
 */
const blockUser = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const { userId: blockedId } = req.params;

    // Cannot block yourself
    if (blockerId === blockedId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot block yourself',
      });
    }

    // Check if target user exists
    const userExists = await query(
      'SELECT id FROM users WHERE id = $1',
      [blockedId]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Create block
    await query(
      `INSERT INTO user_blocks (blocker_id, blocked_id)
       VALUES ($1, $2)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
      [blockerId, blockedId]
    );

    // Also unmatch if there's an active match
    await query(
      `UPDATE matches
       SET status = 'BLOCKED', unmatched_at = NOW(), unmatched_by = $1
       WHERE status = 'ACTIVE'
       AND ((user_a_id = $1 AND user_b_id = $2) OR (user_a_id = $2 AND user_b_id = $1))`,
      [blockerId, blockedId]
    );

    res.json({
      success: true,
      message: 'User has been blocked',
    });
  } catch (error) {
    console.error('Block user error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to block user',
    });
  }
};

/**
 * Unblock a user
 * DELETE /api/v1/users/:userId/block
 */
const unblockUser = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const { userId: blockedId } = req.params;

    const result = await query(
      'DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2 RETURNING id',
      [blockerId, blockedId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Block not found',
      });
    }

    res.json({
      success: true,
      message: 'User has been unblocked',
    });
  } catch (error) {
    console.error('Unblock user error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to unblock user',
    });
  }
};

/**
 * Get blocked users list
 * GET /api/v1/users/blocked
 */
const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT u.id, u.username, u.avatar_url, ub.created_at AS blocked_at
       FROM user_blocks ub
       JOIN users u ON ub.blocked_id = u.id
       WHERE ub.blocker_id = $1
       ORDER BY ub.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get blocked users error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get blocked users',
    });
  }
};

/**
 * Report a user
 * POST /api/v1/users/:userId/report
 */
const reportUser = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { userId: reportedId } = req.params;
    const { reason, description } = req.body;

    // Cannot report yourself
    if (reporterId === reportedId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot report yourself',
      });
    }

    // Check if target user exists
    const userExists = await query(
      'SELECT id FROM users WHERE id = $1',
      [reportedId]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Create report
    const result = await query(
      `INSERT INTO user_reports (reporter_id, reported_id, reason, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [reporterId, reportedId, reason, description]
    );

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our team will review it.',
      data: {
        reportId: result.rows[0].id,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    console.error('Report user error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to submit report',
    });
  }
};

/**
 * Get my reports
 * GET /api/v1/users/me/reports
 */
const getMyReports = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT ur.id, ur.reason, ur.description, ur.status, ur.created_at,
              u.username AS reported_username
       FROM user_reports ur
       JOIN users u ON ur.reported_id = u.id
       WHERE ur.reporter_id = $1
       ORDER BY ur.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get my reports error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get reports',
    });
  }
};

module.exports = {
  blockUser,
  unblockUser,
  getBlockedUsers,
  reportUser,
  getMyReports,
};
