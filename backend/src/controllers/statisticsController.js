const { query } = require('../config/database');

/**
 * Get user statistics
 * GET /api/v1/users/me/statistics
 */
const getMyStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get comprehensive statistics
    const stats = await query(
      `SELECT
        -- Match stats
        (SELECT COUNT(*) FROM matches m
         WHERE (m.user_a_id = $1 OR m.user_b_id = $1) AND m.status = 'ACTIVE') AS active_matches,
        (SELECT COUNT(*) FROM matches m
         WHERE m.user_a_id = $1 OR m.user_b_id = $1) AS total_matches,

        -- Swipe stats
        (SELECT COUNT(*) FROM swipes s WHERE s.actor_id = $1) AS total_swipes,
        (SELECT COUNT(*) FROM swipes s WHERE s.actor_id = $1 AND s.action = 'LIKE') AS total_likes_given,
        (SELECT COUNT(*) FROM swipes s WHERE s.actor_id = $1 AND s.action = 'SUPERLIKE') AS total_superlikes_given,
        (SELECT COUNT(*) FROM swipes s WHERE s.target_id = $1 AND s.action IN ('LIKE', 'SUPERLIKE')) AS received_likes,

        -- Message stats
        (SELECT COUNT(*) FROM messages msg WHERE msg.sender_id = $1) AS messages_sent,
        (SELECT COUNT(DISTINCT match_id) FROM messages msg WHERE msg.sender_id = $1) AS conversations_started,

        -- Ride stats
        (SELECT COUNT(*) FROM recent_rides rr WHERE rr.user_id = $1) AS total_rides,
        (SELECT COALESCE(SUM(rr.distance_km), 0) FROM recent_rides rr WHERE rr.user_id = $1) AS total_distance_km,
        (SELECT COALESCE(AVG(rr.distance_km), 0) FROM recent_rides rr WHERE rr.user_id = $1) AS avg_ride_distance,

        -- Feedback stats
        (SELECT COALESCE(AVG(rf.rating), 0) FROM ride_feedback rf WHERE rf.reviewed_id = $1) AS avg_rating,
        (SELECT COUNT(*) FROM ride_feedback rf WHERE rf.reviewed_id = $1) AS total_feedbacks_received,
        (SELECT COUNT(*) FROM ride_feedback rf WHERE rf.reviewer_id = $1) AS total_feedbacks_given,
        (SELECT COALESCE(
          (SELECT COUNT(*) FROM ride_feedback rf WHERE rf.reviewed_id = $1 AND rf.showed_up = TRUE)::float /
          NULLIF((SELECT COUNT(*) FROM ride_feedback rf WHERE rf.reviewed_id = $1), 0) * 100,
          100
        )) AS show_up_rate,

        -- Live reports
        (SELECT COUNT(*) FROM live_reports lr WHERE lr.user_id = $1) AS total_live_reports,
        (SELECT COUNT(*) FROM live_reports lr WHERE lr.user_id = $1 AND lr.is_active = TRUE) AS active_live_reports`,
      [userId]
    );

    // Get user info
    const userInfo = await query(
      `SELECT created_at, last_seen_at FROM users WHERE id = $1`,
      [userId]
    );

    const statistics = {
      ...stats.rows[0],
      member_since: userInfo.rows[0].created_at,
      last_active: userInfo.rows[0].last_seen_at,
      // Calculate match rate
      match_rate: stats.rows[0].total_likes_given > 0
        ? ((stats.rows[0].total_matches / stats.rows[0].total_likes_given) * 100).toFixed(1)
        : 0,
    };

    // Convert string numbers to actual numbers
    Object.keys(statistics).forEach(key => {
      if (!isNaN(statistics[key]) && statistics[key] !== null && key !== 'member_since' && key !== 'last_active') {
        statistics[key] = parseFloat(statistics[key]);
      }
    });

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Get statistics error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
    });
  }
};

/**
 * Get another user's public statistics
 * GET /api/v1/users/:userId/statistics
 */
const getUserStatistics = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists and is active
    const userExists = await query(
      'SELECT id, username, avatar_url, created_at FROM users WHERE id = $1 AND is_active = TRUE',
      [userId]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get limited public statistics
    const stats = await query(
      `SELECT
        (SELECT COUNT(*) FROM recent_rides rr WHERE rr.user_id = $1) AS total_rides,
        (SELECT COALESCE(SUM(rr.distance_km), 0) FROM recent_rides rr WHERE rr.user_id = $1) AS total_distance_km,
        (SELECT COALESCE(AVG(rf.rating), 0) FROM ride_feedback rf WHERE rf.reviewed_id = $1) AS avg_rating,
        (SELECT COUNT(*) FROM ride_feedback rf WHERE rf.reviewed_id = $1) AS total_feedbacks,
        (SELECT COALESCE(
          (SELECT COUNT(*) FROM ride_feedback rf WHERE rf.reviewed_id = $1 AND rf.showed_up = TRUE)::float /
          NULLIF((SELECT COUNT(*) FROM ride_feedback rf WHERE rf.reviewed_id = $1), 0) * 100,
          100
        )) AS show_up_rate`,
      [userId]
    );

    const user = userExists.rows[0];
    const statistics = stats.rows[0];

    // Convert to numbers
    Object.keys(statistics).forEach(key => {
      if (!isNaN(statistics[key]) && statistics[key] !== null) {
        statistics[key] = parseFloat(statistics[key]);
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatar_url,
          memberSince: user.created_at,
        },
        statistics,
      },
    });
  } catch (error) {
    console.error('Get user statistics error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user statistics',
    });
  }
};

module.exports = {
  getMyStatistics,
  getUserStatistics,
};
