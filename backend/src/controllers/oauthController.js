const { query, getClient } = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/auth');
const config = require('../config/config');

/**
 * Google Sign-In
 * POST /api/v1/auth/google
 *
 * Accepts Google ID token from client and creates/logs in user
 */
const googleSignIn = async (req, res) => {
  const client = await getClient();

  try {
    const { id_token, google_id, email, name, avatar_url } = req.body;

    if (!email || !google_id) {
      return res.status(400).json({
        success: false,
        error: 'Google email and ID are required',
      });
    }

    // Verify token is valid (in production, verify with Google API)
    // For now, we trust the client verification
    // TODO: Add server-side verification with google-auth-library

    await client.query('BEGIN');

    // Check if user exists by email or google_id
    let userResult = await client.query(
      `SELECT u.id, u.username, u.email, u.is_active, u.is_banned,
              u.google_id, u.google_connected
       FROM users u
       WHERE u.email = $1 OR u.google_id = $2`,
      [email, google_id]
    );

    let user;
    let isNewUser = false;

    if (userResult.rows.length === 0) {
      // New user - create account
      const username = name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 1000);

      userResult = await client.query(
        `INSERT INTO users (username, email, password_hash, avatar_url, google_id, google_connected, email_verified)
         VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
         RETURNING id, username, email, created_at`,
        [username, email, '', avatar_url, google_id] // Empty password for OAuth users
      );

      user = userResult.rows[0];
      isNewUser = true;

      // Create empty cyclist profile
      await client.query(
        `INSERT INTO cyclist_profile (user_id, ride_vibe, bike_type)
         VALUES ($1, 'SPORT', 'GRAVEL_MUSCLE')`,
        [user.id]
      );
    } else {
      user = userResult.rows[0];

      // Check if account is banned
      if (user.is_banned) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          error: 'Account has been banned',
        });
      }

      // Check if account is active
      if (!user.is_active) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          error: 'Account is inactive',
        });
      }

      // Update Google connection if not connected
      if (!user.google_connected) {
        await client.query(
          `UPDATE users
           SET google_id = $1, google_connected = TRUE, avatar_url = COALESCE(avatar_url, $2)
           WHERE id = $3`,
          [google_id, avatar_url, user.id]
        );
      }
    }

    // Update last_seen_at
    await client.query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [user.id]);

    await client.query('COMMIT');

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isNewUser,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Google sign-in error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to sign in with Google',
    });
  } finally {
    client.release();
  }
};

/**
 * Strava OAuth
 * POST /api/v1/auth/strava
 *
 * Connect or login with Strava
 */
const stravaConnect = async (req, res) => {
  const client = await getClient();

  try {
    const { code, athlete_id, access_token, refresh_token, athlete } = req.body;
    const userId = req.user?.id; // Optional - can be used to connect existing account

    if (!athlete_id || !access_token) {
      return res.status(400).json({
        success: false,
        error: 'Strava athlete ID and access token are required',
      });
    }

    await client.query('BEGIN');

    if (userId) {
      // Connect Strava to existing account
      await client.query(
        `UPDATE cyclist_profile
         SET strava_athlete_id = $1,
             strava_access_token = $2,
             strava_refresh_token = $3,
             strava_verified = TRUE
         WHERE user_id = $4`,
        [athlete_id, access_token, refresh_token, userId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Strava account connected successfully',
      });
    } else {
      // Login/signup with Strava
      // Check if user exists by strava_athlete_id
      let userResult = await client.query(
        `SELECT u.id, u.username, u.email, u.is_active, u.is_banned
         FROM users u
         JOIN cyclist_profile cp ON u.id = cp.user_id
         WHERE cp.strava_athlete_id = $1`,
        [athlete_id]
      );

      let user;
      let isNewUser = false;

      if (userResult.rows.length === 0) {
        // New user - create account
        const username = (athlete.username || `strava_${athlete_id}`).toLowerCase();
        const email = athlete.email || `strava_${athlete_id}@strava.local`;

        userResult = await client.query(
          `INSERT INTO users (username, email, password_hash, avatar_url, email_verified)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, username, email`,
          [username, email, '', athlete.profile, athlete.email ? true : false]
        );

        user = userResult.rows[0];
        isNewUser = true;

        // Create cyclist profile with Strava data
        await client.query(
          `INSERT INTO cyclist_profile (user_id, ride_vibe, bike_type, strava_athlete_id, strava_access_token, strava_refresh_token, strava_verified)
           VALUES ($1, 'SPORT', 'GRAVEL_MUSCLE', $2, $3, $4, TRUE)`,
          [user.id, athlete_id, access_token, refresh_token]
        );
      } else {
        user = userResult.rows[0];

        if (user.is_banned || !user.is_active) {
          await client.query('ROLLBACK');
          return res.status(403).json({
            success: false,
            error: 'Account is not accessible',
          });
        }

        // Update Strava tokens
        await client.query(
          `UPDATE cyclist_profile
           SET strava_access_token = $1,
               strava_refresh_token = $2,
               strava_verified = TRUE
           WHERE user_id = $3`,
          [access_token, refresh_token, user.id]
        );
      }

      // Update last_seen_at
      await client.query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [user.id]);

      await client.query('COMMIT');

      // Generate tokens
      const accessToken = generateAccessToken({ userId: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ userId: user.id });

      res.status(isNewUser ? 201 : 200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            isNewUser,
          },
          accessToken,
          refreshToken,
        },
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Strava connect error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to connect with Strava',
    });
  } finally {
    client.release();
  }
};

/**
 * Disconnect social account
 * POST /api/v1/auth/disconnect/:provider
 */
const disconnectProvider = async (req, res) => {
  try {
    const userId = req.user.id;
    const { provider } = req.params; // 'google' or 'strava'

    if (provider === 'google') {
      await query(
        `UPDATE users
         SET google_id = NULL, google_connected = FALSE
         WHERE id = $1`,
        [userId]
      );

      res.json({
        success: true,
        message: 'Google account disconnected',
      });
    } else if (provider === 'strava') {
      await query(
        `UPDATE cyclist_profile
         SET strava_athlete_id = NULL,
             strava_access_token = NULL,
             strava_refresh_token = NULL,
             strava_verified = FALSE
         WHERE user_id = $1`,
        [userId]
      );

      res.json({
        success: true,
        message: 'Strava account disconnected',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid provider',
      });
    }
  } catch (error) {
    console.error('Disconnect provider error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to disconnect provider',
    });
  }
};

module.exports = {
  googleSignIn,
  stravaConnect,
  disconnectProvider,
};
