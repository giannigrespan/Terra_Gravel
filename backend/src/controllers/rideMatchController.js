const { query, getClient } = require('../config/database');
const config = require('../config/config');

/**
 * Get stack of potential matches
 * GET /api/v1/ridematch/stack
 */
const getStack = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || config.maxStackSize;

    // Main matching query with compatibility score
    const result = await query(
      `WITH current_user_data AS (
        SELECT
          u.location,
          cp.avg_speed_gravel,
          cp.ride_vibe,
          cp.bike_type,
          cp.min_speed_preference,
          cp.max_speed_preference,
          cp.max_distance_km
        FROM users u
        JOIN cyclist_profile cp ON u.id = cp.user_id
        WHERE u.id = $1
      ),
      already_swiped AS (
        SELECT target_id FROM swipes WHERE actor_id = $1
      )
      SELECT
        u.id,
        u.username,
        u.avatar_url,
        EXTRACT(YEAR FROM AGE(NOW(), u.created_at))::INTEGER AS age_estimate,
        cp.avg_speed_gravel,
        cp.ride_vibe,
        cp.bike_type,
        cp.bio,
        ROUND(ST_Distance(u.location, cud.location) / 1000)::INTEGER AS distance_km,
        cp.strava_verified,
        -- Compatibility score calculation (0-100)
        ROUND((
          -- Distance (closer = better): 30 points max
          (1 - LEAST(ST_Distance(u.location, cud.location) / 1000 / COALESCE(cud.max_distance_km, 20), 1)) * 30 +

          -- Speed similarity (closer = better): 40 points max
          (1 - LEAST(ABS(COALESCE(cp.avg_speed_gravel, 20) - COALESCE(cud.avg_speed_gravel, 20)) / 10, 1)) * 40 +

          -- Same vibe: 20 bonus points
          CASE WHEN cp.ride_vibe = cud.ride_vibe THEN 20 ELSE 0 END +

          -- Recent activity (last_seen < 7 days): 10 bonus points
          CASE WHEN u.last_seen_at > NOW() - INTERVAL '7 days' THEN 10 ELSE 0 END
        ))::INTEGER AS compatibility_score,
        -- Recent rides (last 3)
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'ride_name', ride_name,
              'distance_km', distance_km,
              'difficulty', difficulty
            )
          )
          FROM (
            SELECT ride_name, distance_km, difficulty
            FROM recent_rides
            WHERE user_id = u.id
            ORDER BY ride_date DESC
            LIMIT 3
          ) sub),
          '[]'::json
        ) AS recent_rides
      FROM users u
      JOIN cyclist_profile cp ON u.id = cp.user_id
      CROSS JOIN current_user_data cud
      WHERE
        u.id != $1
        AND u.is_active = TRUE
        AND u.is_banned = FALSE
        AND u.location IS NOT NULL
        AND cud.location IS NOT NULL
        -- Geographic filter (PostGIS)
        AND ST_DWithin(u.location, cud.location, COALESCE(cud.max_distance_km, 20) * 1000)
        -- Speed filter
        AND (
          cud.min_speed_preference IS NULL OR
          cud.max_speed_preference IS NULL OR
          COALESCE(cp.avg_speed_gravel, 20) BETWEEN cud.min_speed_preference AND cud.max_speed_preference
        )
        -- Exclude already swiped
        AND u.id NOT IN (SELECT target_id FROM already_swiped)
      ORDER BY compatibility_score DESC
      LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get stack error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve potential matches',
    });
  }
};

/**
 * Swipe on a user
 * POST /api/v1/ridematch/swipe
 */
const swipe = async (req, res) => {
  const client = await getClient();

  try {
    const actorId = req.user.id;
    const { target_id, action } = req.body;

    // Validate target user exists and is not the actor
    if (target_id === actorId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot swipe on yourself',
      });
    }

    const targetCheck = await query(
      'SELECT id FROM users WHERE id = $1 AND is_active = TRUE',
      [target_id]
    );

    if (targetCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Target user not found',
      });
    }

    await client.query('BEGIN');

    // Insert swipe (will trigger match creation if mutual)
    const swipeResult = await client.query(
      `INSERT INTO swipes (actor_id, target_id, action)
       VALUES ($1, $2, $3)
       ON CONFLICT (actor_id, target_id) DO UPDATE
       SET action = $3, created_at = NOW()
       RETURNING id, created_at`,
      [actorId, target_id, action]
    );

    // Check if a match was created
    const matchCheck = await client.query(
      `SELECT id, matched_at
       FROM matches
       WHERE status = 'ACTIVE'
       AND ((user_a_id = $1 AND user_b_id = $2) OR (user_a_id = $2 AND user_b_id = $1))`,
      [actorId, target_id]
    );

    await client.query('COMMIT');

    const matched = matchCheck.rows.length > 0;
    const matchData = matched ? matchCheck.rows[0] : null;

    res.json({
      success: true,
      data: {
        swipe_id: swipeResult.rows[0].id,
        action,
        matched,
        match_id: matchData?.id || null,
        matched_at: matchData?.matched_at || null,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Swipe error:', error);

    if (error.constraint === 'swipes_actor_id_target_id_key') {
      return res.status(409).json({
        success: false,
        error: 'Already swiped on this user',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process swipe',
    });
  } finally {
    client.release();
  }
};

/**
 * Get user's matches
 * GET /api/v1/ridematch/matches
 */
const getMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const status = req.query.status || 'ACTIVE';
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await query(
      `SELECT
        m.id,
        m.status,
        m.matched_at,
        m.last_message_at,
        -- Get the other user's info
        CASE
          WHEN m.user_a_id = $1 THEN u_b.id
          ELSE u_a.id
        END AS other_user_id,
        CASE
          WHEN m.user_a_id = $1 THEN u_b.username
          ELSE u_a.username
        END AS other_username,
        CASE
          WHEN m.user_a_id = $1 THEN u_b.avatar_url
          ELSE u_a.avatar_url
        END AS other_avatar_url,
        CASE
          WHEN m.user_a_id = $1 THEN cp_b.bio
          ELSE cp_a.bio
        END AS other_bio,
        -- Get last message preview
        (SELECT content FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) AS last_message
      FROM matches m
      JOIN users u_a ON m.user_a_id = u_a.id
      JOIN users u_b ON m.user_b_id = u_b.id
      LEFT JOIN cyclist_profile cp_a ON u_a.id = cp_a.user_id
      LEFT JOIN cyclist_profile cp_b ON u_b.id = cp_b.user_id
      WHERE
        (m.user_a_id = $1 OR m.user_b_id = $1)
        AND m.status = $2
      ORDER BY COALESCE(m.last_message_at, m.matched_at) DESC
      LIMIT $3 OFFSET $4`,
      [userId, status, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get matches error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve matches',
    });
  }
};

/**
 * Unmatch a user
 * POST /api/v1/ridematch/unmatch
 */
const unmatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { match_id } = req.body;

    // Verify the match belongs to the user
    const matchCheck = await query(
      `SELECT id FROM matches
       WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)`,
      [match_id, userId]
    );

    if (matchCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Match not found',
      });
    }

    // Update match status
    await query(
      `UPDATE matches
       SET status = 'UNMATCHED',
           unmatched_at = NOW(),
           unmatched_by = $2
       WHERE id = $1`,
      [match_id, userId]
    );

    res.json({
      success: true,
      message: 'Unmatched successfully',
    });
  } catch (error) {
    console.error('Unmatch error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to unmatch',
    });
  }
};

module.exports = {
  getStack,
  swipe,
  getMatches,
  unmatch,
};
