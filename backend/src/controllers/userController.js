const { query } = require('../config/database');
const { roundLocationTo1km } = require('../utils/auth');

/**
 * Get current user profile
 * GET /api/v1/users/me
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT
        u.id, u.username, u.email, u.avatar_url,
        ST_Y(u.location::geometry) as latitude,
        ST_X(u.location::geometry) as longitude,
        u.created_at, u.updated_at,
        cp.avg_speed_gravel, cp.ride_vibe, cp.bike_type, cp.bio,
        cp.available_weekend, cp.available_weekday,
        cp.max_distance_km, cp.min_speed_preference, cp.max_speed_preference,
        cp.strava_verified
       FROM users u
       LEFT JOIN cyclist_profile cp ON u.id = cp.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get user error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile',
    });
  }
};

/**
 * Update current user profile
 * PATCH /api/v1/users/me
 */
const updateMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, avatar_url } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }

    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    values.push(userId);

    const result = await query(
      `UPDATE users
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING id, username, email, avatar_url, updated_at`,
      values
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error.constraint === 'users_username_key') {
      return res.status(409).json({
        success: false,
        error: 'Username already taken',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
    });
  }
};

/**
 * Update user location
 * PUT /api/v1/users/me/location
 */
const updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    // Round location for privacy
    const rounded = roundLocationTo1km(latitude, longitude);

    await query(
      `UPDATE users
       SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           updated_at = NOW()
       WHERE id = $3`,
      [rounded.lon, rounded.lat, userId]
    );

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        latitude: rounded.lat,
        longitude: rounded.lon,
      },
    });
  } catch (error) {
    console.error('Update location error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to update location',
    });
  }
};

/**
 * Delete current user account
 * DELETE /api/v1/users/me
 */
const deleteMe = async (req, res) => {
  try {
    const userId = req.user.id;

    // Soft delete by marking as inactive
    await query(
      'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to deactivate account',
    });
  }
};

module.exports = {
  getMe,
  updateMe,
  updateLocation,
  deleteMe,
};
