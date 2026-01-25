const { query } = require('../config/database');

/**
 * Search users by username
 * GET /api/v1/users/search
 */
const searchUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
    }

    // Search for users, excluding blocked users and self
    const result = await query(
      `SELECT u.id, u.username, u.avatar_url,
              cp.ride_vibe, cp.bike_type,
              CASE
                WHEN m.id IS NOT NULL AND m.status = 'ACTIVE' THEN TRUE
                ELSE FALSE
              END AS is_matched
       FROM users u
       LEFT JOIN cyclist_profile cp ON u.id = cp.user_id
       LEFT JOIN matches m ON (
         (m.user_a_id = $1 AND m.user_b_id = u.id) OR
         (m.user_b_id = $1 AND m.user_a_id = u.id)
       ) AND m.status = 'ACTIVE'
       WHERE u.username ILIKE $2
         AND u.is_active = TRUE
         AND u.is_banned = FALSE
         AND u.id != $1
         AND u.id NOT IN (
           SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
           UNION
           SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
         )
       ORDER BY
         CASE WHEN u.username ILIKE $3 THEN 0 ELSE 1 END,
         u.username
       LIMIT $4`,
      [userId, `%${q}%`, `${q}%`, Math.min(limit, 50)]
    );

    res.json({
      success: true,
      data: result.rows,
      meta: {
        query: q,
        total: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Search users error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to search users',
    });
  }
};

/**
 * Get user profile by username
 * GET /api/v1/users/username/:username
 */
const getUserByUsername = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { username } = req.params;

    const result = await query(
      `SELECT u.id, u.username, u.avatar_url, u.created_at,
              cp.avg_speed_gravel, cp.ride_vibe, cp.bike_type, cp.bio,
              cp.available_weekend, cp.available_weekday, cp.strava_verified,
              CASE
                WHEN m.id IS NOT NULL AND m.status = 'ACTIVE' THEN TRUE
                ELSE FALSE
              END AS is_matched,
              m.id AS match_id
       FROM users u
       LEFT JOIN cyclist_profile cp ON u.id = cp.user_id
       LEFT JOIN matches m ON (
         (m.user_a_id = $1 AND m.user_b_id = u.id) OR
         (m.user_b_id = $1 AND m.user_a_id = u.id)
       ) AND m.status = 'ACTIVE'
       WHERE u.username = $2
         AND u.is_active = TRUE
         AND u.is_banned = FALSE`,
      [currentUserId, username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if blocked
    const isBlocked = await query(
      `SELECT id FROM user_blocks
       WHERE (blocker_id = $1 AND blocked_id = $2)
          OR (blocker_id = $2 AND blocked_id = $1)`,
      [currentUserId, result.rows[0].id]
    );

    if (isBlocked.rows.length > 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get recent rides
    const rides = await query(
      `SELECT ride_name, distance_km, difficulty, ride_date
       FROM recent_rides
       WHERE user_id = $1
       ORDER BY ride_date DESC
       LIMIT 3`,
      [result.rows[0].id]
    );

    // Get reputation
    const reputation = await query(
      `SELECT
        COUNT(*) AS total_feedbacks,
        COALESCE(AVG(rating), 0) AS avg_rating,
        COALESCE(
          (COUNT(*) FILTER (WHERE showed_up = TRUE))::float /
          NULLIF(COUNT(*), 0) * 100,
          100
        ) AS show_up_rate
       FROM ride_feedback
       WHERE reviewed_id = $1`,
      [result.rows[0].id]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        recentRides: rides.rows,
        reputation: {
          totalFeedbacks: parseInt(reputation.rows[0].total_feedbacks),
          avgRating: parseFloat(reputation.rows[0].avg_rating).toFixed(1),
          showUpRate: parseFloat(reputation.rows[0].show_up_rate).toFixed(0),
        },
      },
    });
  } catch (error) {
    console.error('Get user by username error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile',
    });
  }
};

module.exports = {
  searchUsers,
  getUserByUsername,
};
