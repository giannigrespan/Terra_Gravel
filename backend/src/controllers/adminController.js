const { query } = require('../config/database');

/**
 * Get dashboard statistics
 * GET /api/v1/admin/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS total_active_users,
        (SELECT COUNT(*) FROM users WHERE is_banned = TRUE) AS total_banned_users,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours') AS new_users_24h,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') AS new_users_7d,
        (SELECT COUNT(*) FROM matches WHERE status = 'ACTIVE') AS total_active_matches,
        (SELECT COUNT(*) FROM matches WHERE matched_at > NOW() - INTERVAL '24 hours') AS new_matches_24h,
        (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours') AS messages_24h,
        (SELECT COUNT(*) FROM user_reports WHERE status = 'PENDING') AS pending_reports,
        (SELECT COUNT(*) FROM live_reports WHERE is_active = TRUE) AS active_live_reports,
        (SELECT COUNT(*) FROM swipes WHERE created_at > NOW() - INTERVAL '24 hours') AS swipes_24h
    `);

    // Convert to numbers
    const data = stats.rows[0];
    Object.keys(data).forEach(key => {
      data[key] = parseInt(data[key]) || 0;
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
    });
  }
};

/**
 * Get all users (paginated)
 * GET /api/v1/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, sortBy = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (search) {
      whereConditions.push(`(username ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status === 'active') {
      whereConditions.push('is_active = TRUE AND is_banned = FALSE');
    } else if (status === 'banned') {
      whereConditions.push('is_banned = TRUE');
    } else if (status === 'inactive') {
      whereConditions.push('is_active = FALSE');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort column
    const allowedSorts = ['created_at', 'last_seen_at', 'username', 'email'];
    const sortColumn = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );

    // Get users
    params.push(limit, offset);
    const result = await query(
      `SELECT id, username, email, avatar_url, is_active, is_banned, is_admin,
              email_verified, google_connected, created_at, last_seen_at
       FROM users
       ${whereClause}
       ORDER BY ${sortColumn} ${sortOrder}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      meta: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve users',
    });
  }
};

/**
 * Get user details
 * GET /api/v1/admin/users/:userId
 */
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const userResult = await query(
      `SELECT u.*, cp.avg_speed_gravel, cp.ride_vibe, cp.bike_type, cp.bio,
              cp.strava_verified
       FROM users u
       LEFT JOIN cyclist_profile cp ON u.id = cp.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get user statistics
    const stats = await query(
      `SELECT
        (SELECT COUNT(*) FROM matches m WHERE m.user_a_id = $1 OR m.user_b_id = $1) AS total_matches,
        (SELECT COUNT(*) FROM messages msg WHERE msg.sender_id = $1) AS messages_sent,
        (SELECT COUNT(*) FROM user_reports WHERE reported_id = $1) AS times_reported,
        (SELECT COUNT(*) FROM user_reports WHERE reporter_id = $1) AS reports_made,
        (SELECT COALESCE(AVG(rating), 0) FROM ride_feedback WHERE reviewed_id = $1) AS avg_rating`,
      [userId]
    );

    // Get recent reports against this user
    const reports = await query(
      `SELECT ur.id, ur.reason, ur.description, ur.status, ur.created_at,
              u.username AS reporter_username
       FROM user_reports ur
       JOIN users u ON ur.reporter_id = u.id
       WHERE ur.reported_id = $1
       ORDER BY ur.created_at DESC
       LIMIT 10`,
      [userId]
    );

    const user = userResult.rows[0];
    delete user.password_hash; // Never expose password hash

    res.json({
      success: true,
      data: {
        user,
        statistics: stats.rows[0],
        recentReports: reports.rows,
      },
    });
  } catch (error) {
    console.error('Get user details error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user details',
    });
  }
};

/**
 * Ban a user
 * PUT /api/v1/admin/users/:userId/ban
 */
const banUser = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;
    const { reason } = req.body;

    // Cannot ban yourself
    if (adminId === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot ban yourself',
      });
    }

    // Cannot ban other admins
    const targetUser = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );

    if (targetUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (targetUser.rows[0].is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Cannot ban an admin user',
      });
    }

    await query(
      'UPDATE users SET is_banned = TRUE, updated_at = NOW() WHERE id = $1',
      [userId]
    );

    // Log the ban action (could be stored in audit_logs table)
    console.log(`User ${userId} banned by admin ${adminId}. Reason: ${reason}`);

    res.json({
      success: true,
      message: 'User has been banned',
    });
  } catch (error) {
    console.error('Ban user error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to ban user',
    });
  }
};

/**
 * Unban a user
 * PUT /api/v1/admin/users/:userId/unban
 */
const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      'UPDATE users SET is_banned = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id',
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
      message: 'User has been unbanned',
    });
  } catch (error) {
    console.error('Unban user error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to unban user',
    });
  }
};

/**
 * Get all reports (paginated)
 * GET /api/v1/admin/reports
 */
const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];

    if (status) {
      whereClause = 'WHERE ur.status = $1';
      params.push(status);
    }

    params.push(limit, offset);

    const countResult = await query(
      `SELECT COUNT(*) FROM user_reports ur ${whereClause}`,
      status ? [status] : []
    );

    const paramOffset = status ? 2 : 1;
    const result = await query(
      `SELECT ur.id, ur.reason, ur.description, ur.status, ur.created_at,
              ur.reviewed_at, ur.admin_notes,
              reporter.username AS reporter_username, reporter.id AS reporter_id,
              reported.username AS reported_username, reported.id AS reported_id
       FROM user_reports ur
       JOIN users reporter ON ur.reporter_id = reporter.id
       JOIN users reported ON ur.reported_id = reported.id
       ${whereClause}
       ORDER BY ur.created_at DESC
       LIMIT $${paramOffset} OFFSET $${paramOffset + 1}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      meta: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reports',
    });
  }
};

/**
 * Update report status
 * PUT /api/v1/admin/reports/:reportId
 */
const updateReport = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    const result = await query(
      `UPDATE user_reports
       SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4
       RETURNING id, status, admin_notes, reviewed_at`,
      [status, adminNotes, adminId, reportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    res.json({
      success: true,
      message: 'Report updated',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update report error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to update report',
    });
  }
};

/**
 * Make a user admin
 * PUT /api/v1/admin/users/:userId/make-admin
 */
const makeAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      'UPDATE users SET is_admin = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id, username',
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
      message: `User ${result.rows[0].username} is now an admin`,
    });
  } catch (error) {
    console.error('Make admin error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to make user admin',
    });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserDetails,
  banUser,
  unbanUser,
  getReports,
  updateReport,
  makeAdmin,
};
