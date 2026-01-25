const { query } = require('../config/database');

/**
 * Middleware to check if user is an admin
 * Must be used after authenticate middleware
 */
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    req.user.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to verify admin status',
    });
  }
};

module.exports = {
  isAdmin,
};
