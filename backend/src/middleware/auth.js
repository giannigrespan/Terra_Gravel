const { verifyToken } = require('../utils/auth');
const { query } = require('../config/database');

/**
 * Middleware to authenticate requests using JWT
 * Extracts token from Authorization header and verifies it
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Please authenticate.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists and is active
    const result = await query(
      'SELECT id, username, email, is_active, is_banned FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Token invalid.',
      });
    }

    const user = result.rows[0];

    // Check if user is banned or inactive
    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        error: 'Account has been banned.',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive.',
      });
    }

    // Update last_seen_at
    await query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [user.id]);

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please login again.',
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed.',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const result = await query(
      'SELECT id, username, email, is_active, is_banned FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length > 0 && result.rows[0].is_active && !result.rows[0].is_banned) {
      req.user = result.rows[0];
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};
