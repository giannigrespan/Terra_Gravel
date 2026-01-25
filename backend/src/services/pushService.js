/**
 * Push Notification Service
 * Supports Firebase Cloud Messaging (FCM)
 */

const { query } = require('../config/database');

// Firebase Admin SDK (lazy-loaded)
let firebaseAdmin = null;

/**
 * Initialize Firebase Admin SDK
 */
const initializeFirebase = () => {
  if (firebaseAdmin) return firebaseAdmin;

  try {
    const admin = require('firebase-admin');

    // Check if already initialized
    if (admin.apps.length > 0) {
      firebaseAdmin = admin;
      return firebaseAdmin;
    }

    // Initialize with service account
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Parse JSON from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Use individual environment variables
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      console.warn('[PUSH] Firebase not configured. Push notifications disabled.');
      return null;
    }

    firebaseAdmin = admin;
    console.log('[PUSH] Firebase initialized successfully');
    return firebaseAdmin;
  } catch (error) {
    console.error('[PUSH] Firebase initialization failed:', error.message);
    return null;
  }
};

/**
 * Get user's device tokens from database
 */
const getUserDeviceTokens = async (userId) => {
  const result = await query(
    `SELECT token, platform FROM device_tokens
     WHERE user_id = $1 AND is_active = TRUE`,
    [userId]
  );
  return result.rows;
};

/**
 * Send push notification to a single user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification content
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {Object} data - Additional data payload
 */
const sendPushToUser = async (userId, notification, data = {}) => {
  try {
    const admin = initializeFirebase();
    if (!admin) {
      console.log(`[PUSH] Firebase not configured. Skipping push to user ${userId}`);
      return { success: false, error: 'Firebase not configured' };
    }

    const devices = await getUserDeviceTokens(userId);
    if (devices.length === 0) {
      console.log(`[PUSH] No devices registered for user ${userId}`);
      return { success: false, error: 'No devices registered' };
    }

    const tokens = devices.map(d => d.token);

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Handle failed tokens (remove invalid ones)
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.warn(`[PUSH] Failed to send to token: ${resp.error?.message}`);
        }
      });

      // Deactivate failed tokens
      if (failedTokens.length > 0) {
        await query(
          `UPDATE device_tokens SET is_active = FALSE WHERE token = ANY($1::text[])`,
          [failedTokens]
        );
      }
    }

    console.log(`[PUSH] Sent to user ${userId}: ${notification.title} (${response.successCount}/${tokens.length} delivered)`);

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('[PUSH] Error sending notification:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to multiple users
 */
const sendPushToUsers = async (userIds, notification, data = {}) => {
  const results = await Promise.all(
    userIds.map(userId => sendPushToUser(userId, notification, data))
  );

  return {
    success: results.some(r => r.success),
    results,
  };
};

/**
 * Store notification in database and send push
 */
const createAndSendNotification = async (userId, type, title, body, data = {}) => {
  try {
    // Store in notifications table
    await query(
      `INSERT INTO notifications (user_id, notification_type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, JSON.stringify(data)]
    );

    // Send push notification
    const pushResult = await sendPushToUser(userId, { title, body }, data);

    // Mark as sent if push succeeded
    if (pushResult.success) {
      await query(
        `UPDATE notifications
         SET is_sent = TRUE, sent_at = NOW()
         WHERE user_id = $1 AND title = $2 AND is_sent = FALSE
         ORDER BY created_at DESC LIMIT 1`,
        [userId, title]
      );
    }

    return pushResult;
  } catch (error) {
    console.error('[PUSH] Error creating notification:', error.message);
    return { success: false, error: error.message };
  }
};

// ==========================================
// Notification Templates
// ==========================================

/**
 * Send new match notification
 */
const sendMatchNotification = async (userId, matchedUsername, matchId) => {
  return createAndSendNotification(
    userId,
    'MATCH',
    'New Match! 🎉',
    `You matched with ${matchedUsername}! Start chatting now.`,
    { matchId, type: 'match' }
  );
};

/**
 * Send new message notification
 */
const sendMessageNotification = async (userId, senderUsername, matchId, messagePreview) => {
  const preview = messagePreview.length > 50
    ? messagePreview.substring(0, 50) + '...'
    : messagePreview;

  return createAndSendNotification(
    userId,
    'MESSAGE',
    `${senderUsername}`,
    preview,
    { matchId, type: 'message' }
  );
};

/**
 * Send ride reminder notification
 */
const sendRideReminderNotification = async (userId, rideName, rideTime) => {
  return createAndSendNotification(
    userId,
    'RIDE_REMINDER',
    'Ride Reminder 🚴',
    `Don't forget: ${rideName} at ${rideTime}`,
    { type: 'ride_reminder' }
  );
};

/**
 * Send feedback request notification
 */
const sendFeedbackRequestNotification = async (userId, partnerUsername, matchId) => {
  return createAndSendNotification(
    userId,
    'FEEDBACK_REQUEST',
    'How was your ride?',
    `Rate your ride with ${partnerUsername}`,
    { matchId, type: 'feedback_request' }
  );
};

/**
 * Send system notification
 */
const sendSystemNotification = async (userId, title, body, data = {}) => {
  return createAndSendNotification(
    userId,
    'SYSTEM',
    title,
    body,
    { ...data, type: 'system' }
  );
};

/**
 * Send notification to topic (all users subscribed)
 */
const sendToTopic = async (topic, notification, data = {}) => {
  try {
    const admin = initializeFirebase();
    if (!admin) {
      return { success: false, error: 'Firebase not configured' };
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      topic,
    };

    const response = await admin.messaging().send(message);
    console.log(`[PUSH] Sent to topic ${topic}: ${notification.title}`);

    return { success: true, messageId: response };
  } catch (error) {
    console.error('[PUSH] Error sending to topic:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initializeFirebase,
  sendPushToUser,
  sendPushToUsers,
  createAndSendNotification,
  sendMatchNotification,
  sendMessageNotification,
  sendRideReminderNotification,
  sendFeedbackRequestNotification,
  sendSystemNotification,
  sendToTopic,
};
