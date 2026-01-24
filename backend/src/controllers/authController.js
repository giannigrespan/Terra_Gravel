const { query, getClient } = require('../config/database');
const {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require('../utils/auth');

/**
 * Register a new user
 * POST /api/v1/auth/signup
 */
const signup = async (req, res) => {
  const client = await getClient();

  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email or username already exists',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Start transaction
    await client.query('BEGIN');

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );

    const user = userResult.rows[0];

    // Create empty cyclist profile
    await client.query(
      `INSERT INTO cyclist_profile (user_id, ride_vibe, bike_type)
       VALUES ($1, 'SPORT', 'GRAVEL_MUSCLE')`,
      [user.id]
    );

    await client.query('COMMIT');

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.created_at,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to create user account',
    });
  } finally {
    client.release();
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const result = await query(
      `SELECT id, username, email, password_hash, is_active, is_banned
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    // Check if user is banned
    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        error: 'Account has been banned',
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Update last_seen_at
    await query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [user.id]);

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
    });

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);

    res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token',
    });
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
const logout = async (req, res) => {
  // In a JWT-based system, logout is typically handled client-side
  // by removing the token. This endpoint is here for completeness
  // and can be used to implement token blacklisting if needed.

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

module.exports = {
  signup,
  login,
  refreshToken,
  logout,
};
