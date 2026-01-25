const { query } = require('../config/database');

/**
 * Get activity feed
 * GET /api/v1/feed
 */
const getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT a.id, a.activity_type, a.related_id, a.metadata, a.is_read, a.created_at,
              ru.id AS related_user_id, ru.username AS related_username, ru.avatar_url AS related_avatar
       FROM activities a
       LEFT JOIN users ru ON a.related_user_id = ru.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, Math.min(limit, 50), offset]
    );

    // Get unread count
    const unreadCount = await query(
      'SELECT COUNT(*) FROM activities WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
      meta: {
        total: result.rows.length,
        unreadCount: parseInt(unreadCount.rows[0].count),
        offset: parseInt(offset),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get feed error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve activity feed',
    });
  }
};

/**
 * Mark activities as read
 * PUT /api/v1/feed/read
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { activityIds } = req.body;

    if (activityIds && activityIds.length > 0) {
      // Mark specific activities as read
      await query(
        `UPDATE activities
         SET is_read = TRUE
         WHERE user_id = $1 AND id = ANY($2::uuid[])`,
        [userId, activityIds]
      );
    } else {
      // Mark all as read
      await query(
        'UPDATE activities SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
        [userId]
      );
    }

    res.json({
      success: true,
      message: 'Activities marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to mark activities as read',
    });
  }
};

/**
 * Get unread count
 * GET /api/v1/feed/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT COUNT(*) FROM activities WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      data: {
        unreadCount: parseInt(result.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get unread count',
    });
  }
};

/**
 * Delete activity
 * DELETE /api/v1/feed/:activityId
 */
const deleteActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { activityId } = req.params;

    const result = await query(
      'DELETE FROM activities WHERE id = $1 AND user_id = $2 RETURNING id',
      [activityId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found',
      });
    }

    res.json({
      success: true,
      message: 'Activity deleted',
    });
  } catch (error) {
    console.error('Delete activity error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to delete activity',
    });
  }
};

/**
 * Create custom activity (for manual events)
 */
const createActivity = async (userId, activityType, relatedId = null, relatedUserId = null, metadata = null) => {
  try {
    await query(
      `INSERT INTO activities (user_id, activity_type, related_id, related_user_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, activityType, relatedId, relatedUserId, metadata ? JSON.stringify(metadata) : null]
    );
    return true;
  } catch (error) {
    console.error('Create activity error:', error);
    return false;
  }
};

module.exports = {
  getFeed,
  markAsRead,
  getUnreadCount,
  deleteActivity,
  createActivity,
};
