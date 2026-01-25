const { query } = require('../config/database');

/**
 * Register device token for push notifications
 * POST /api/v1/users/me/devices
 */
const registerDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token, platform, deviceName } = req.body;

    if (!token || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Token and platform are required',
      });
    }

    // Upsert device token
    await query(
      `INSERT INTO device_tokens (user_id, token, platform, device_name, last_used_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (token)
       DO UPDATE SET user_id = $1, platform = $3, device_name = $4, is_active = TRUE, last_used_at = NOW()`,
      [userId, token, platform, deviceName]
    );

    res.status(201).json({
      success: true,
      message: 'Device registered for push notifications',
    });
  } catch (error) {
    console.error('Register device error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to register device',
    });
  }
};

/**
 * Unregister device token
 * DELETE /api/v1/users/me/devices/:token
 */
const unregisterDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.params;

    const result = await query(
      'UPDATE device_tokens SET is_active = FALSE WHERE user_id = $1 AND token = $2 RETURNING id',
      [userId, token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
      });
    }

    res.json({
      success: true,
      message: 'Device unregistered',
    });
  } catch (error) {
    console.error('Unregister device error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to unregister device',
    });
  }
};

/**
 * Get registered devices
 * GET /api/v1/users/me/devices
 */
const getDevices = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT id, platform, device_name, last_used_at, created_at
       FROM device_tokens
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY last_used_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get devices error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get devices',
    });
  }
};

/**
 * Get notifications
 * GET /api/v1/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    let whereClause = 'WHERE user_id = $1';
    if (unreadOnly === 'true') {
      whereClause += ' AND is_read = FALSE';
    }

    const result = await query(
      `SELECT id, notification_type, title, body, data, is_read, read_at, created_at
       FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, Math.min(limit, 50), offset]
    );

    const unreadCount = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
      meta: {
        unreadCount: parseInt(unreadCount.rows[0].count),
        offset: parseInt(offset),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
    });
  }
};

/**
 * Mark notifications as read
 * PUT /api/v1/notifications/read
 */
const markNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (notificationIds && notificationIds.length > 0) {
      await query(
        `UPDATE notifications
         SET is_read = TRUE, read_at = NOW()
         WHERE user_id = $1 AND id = ANY($2::uuid[])`,
        [userId, notificationIds]
      );
    } else {
      await query(
        `UPDATE notifications
         SET is_read = TRUE, read_at = NOW()
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );
    }

    res.json({
      success: true,
      message: 'Notifications marked as read',
    });
  } catch (error) {
    console.error('Mark notifications read error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read',
    });
  }
};

/**
 * Create and queue a notification
 * This is an internal function, not an endpoint
 */
const createNotification = async (userId, type, title, body, data = null) => {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, notification_type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, type, title, body, data ? JSON.stringify(data) : null]
    );

    // TODO: Integrate with Firebase Cloud Messaging or other push service
    // For now, just store in database
    // await sendPushNotification(userId, title, body, data);

    return result.rows[0].id;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

/**
 * Send push notification (placeholder for Firebase integration)
 * TODO: Implement actual Firebase Cloud Messaging
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // Get user's active device tokens
    const devices = await query(
      'SELECT token, platform FROM device_tokens WHERE user_id = $1 AND is_active = TRUE',
      [userId]
    );

    if (devices.rows.length === 0) {
      console.log(`No devices registered for user ${userId}`);
      return false;
    }

    // TODO: Implement Firebase Admin SDK
    // const admin = require('firebase-admin');
    // const message = {
    //   notification: { title, body },
    //   data,
    //   tokens: devices.rows.map(d => d.token),
    // };
    // await admin.messaging().sendMulticast(message);

    console.log(`Push notification queued for user ${userId}: ${title}`);
    return true;
  } catch (error) {
    console.error('Send push notification error:', error);
    return false;
  }
};

module.exports = {
  registerDevice,
  unregisterDevice,
  getDevices,
  getNotifications,
  markNotificationsRead,
  createNotification,
  sendPushNotification,
};
