const { query } = require('../config/database');

/**
 * Get cyclist profile
 * GET /api/v1/cyclist-profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT
        user_id, avg_speed_gravel, avg_speed_updated_at,
        ride_vibe, bike_type, bio,
        available_weekend, available_weekday,
        max_distance_km, min_speed_preference, max_speed_preference,
        strava_verified, created_at, updated_at
       FROM cyclist_profile
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cyclist profile not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get cyclist profile error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cyclist profile',
    });
  }
};

/**
 * Update cyclist profile
 * PUT /api/v1/cyclist-profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      avg_speed_gravel,
      ride_vibe,
      bike_type,
      bio,
      available_weekend,
      available_weekday,
      max_distance_km,
      min_speed_preference,
      max_speed_preference,
    } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (avg_speed_gravel !== undefined) {
      updates.push(`avg_speed_gravel = $${paramCount++}`);
      values.push(avg_speed_gravel);
      updates.push(`avg_speed_updated_at = NOW()`);
    }

    if (ride_vibe !== undefined) {
      updates.push(`ride_vibe = $${paramCount++}`);
      values.push(ride_vibe);
    }

    if (bike_type !== undefined) {
      updates.push(`bike_type = $${paramCount++}`);
      values.push(bike_type);
    }

    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }

    if (available_weekend !== undefined) {
      updates.push(`available_weekend = $${paramCount++}`);
      values.push(available_weekend);
    }

    if (available_weekday !== undefined) {
      updates.push(`available_weekday = $${paramCount++}`);
      values.push(available_weekday);
    }

    if (max_distance_km !== undefined) {
      updates.push(`max_distance_km = $${paramCount++}`);
      values.push(max_distance_km);
    }

    if (min_speed_preference !== undefined) {
      updates.push(`min_speed_preference = $${paramCount++}`);
      values.push(min_speed_preference);
    }

    if (max_speed_preference !== undefined) {
      updates.push(`max_speed_preference = $${paramCount++}`);
      values.push(max_speed_preference);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    values.push(userId);

    const result = await query(
      `UPDATE cyclist_profile
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cyclist profile not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update cyclist profile error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to update cyclist profile',
    });
  }
};

/**
 * Get recent rides for current user
 * GET /api/v1/cyclist-profile/recent-rides
 */
const getRecentRides = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const result = await query(
      `SELECT id, ride_name, distance_km, difficulty, ride_date, gpx_url, created_at
       FROM recent_rides
       WHERE user_id = $1
       ORDER BY ride_date DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get recent rides error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recent rides',
    });
  }
};

/**
 * Add a recent ride
 * POST /api/v1/cyclist-profile/recent-rides
 */
const addRecentRide = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ride_name, distance_km, difficulty, ride_date, gpx_url } = req.body;

    const result = await query(
      `INSERT INTO recent_rides (user_id, ride_name, distance_km, difficulty, ride_date, gpx_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, ride_name, distance_km, difficulty, ride_date, gpx_url]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Add recent ride error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to add recent ride',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getRecentRides,
  addRecentRide,
};
