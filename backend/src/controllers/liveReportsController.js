const { query } = require('../config/database');

/**
 * Create a live road report
 * POST /api/v1/reports
 */
const createReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reportType, description, latitude, longitude, severity, photoUrl } = req.body;

    // Default expiration based on report type
    const expirationHours = {
      'ROAD_CLOSED': 72,
      'MUD': 48,
      'FALLEN_TREE': 24,
      'DANGEROUS_DOGS': 168, // 1 week
      'FLOODING': 48,
      'CONSTRUCTION': 168,
      'ICE': 24,
      'GRAVEL_CONDITION': 72,
      'OTHER': 24,
    };

    const hours = expirationHours[reportType] || 24;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const result = await query(
      `INSERT INTO live_reports (user_id, report_type, description, location, severity, photo_url, expires_at)
       VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, $6, $7, $8)
       RETURNING id, report_type, description, severity, expires_at, created_at,
                 ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude`,
      [userId, reportType, description, longitude, latitude, severity || 3, photoUrl, expiresAt]
    );

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create report error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to create report',
    });
  }
};

/**
 * Get live reports in area
 * GET /api/v1/reports
 */
const getReports = async (req, res) => {
  try {
    const { latitude, longitude, radius = 20, reportType } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    let queryText = `
      SELECT lr.id, lr.report_type, lr.description, lr.severity, lr.photo_url,
             lr.confirmations, lr.denials, lr.expires_at, lr.created_at,
             ST_Y(lr.location::geometry) as latitude,
             ST_X(lr.location::geometry) as longitude,
             ST_Distance(lr.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000 as distance_km,
             u.username, u.avatar_url
      FROM live_reports lr
      JOIN users u ON lr.user_id = u.id
      WHERE lr.is_active = TRUE
        AND lr.expires_at > NOW()
        AND ST_DWithin(lr.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3 * 1000)
    `;

    const params = [longitude, latitude, radius];

    if (reportType) {
      queryText += ` AND lr.report_type = $4`;
      params.push(reportType);
    }

    queryText += ` ORDER BY distance_km ASC LIMIT 100`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows,
      meta: {
        total: result.rows.length,
        radius: parseFloat(radius),
        center: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
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
 * Get single report
 * GET /api/v1/reports/:reportId
 */
const getReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const result = await query(
      `SELECT lr.id, lr.report_type, lr.description, lr.severity, lr.photo_url,
              lr.confirmations, lr.denials, lr.is_active, lr.expires_at, lr.created_at,
              ST_Y(lr.location::geometry) as latitude,
              ST_X(lr.location::geometry) as longitude,
              u.id as user_id, u.username, u.avatar_url
       FROM live_reports lr
       JOIN users u ON lr.user_id = u.id
       WHERE lr.id = $1`,
      [reportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get report error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve report',
    });
  }
};

/**
 * Vote on a report (confirm or deny)
 * POST /api/v1/reports/:reportId/vote
 */
const voteReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reportId } = req.params;
    const { isConfirmation } = req.body;

    // Check if report exists and is active
    const reportExists = await query(
      'SELECT id, user_id FROM live_reports WHERE id = $1 AND is_active = TRUE AND expires_at > NOW()',
      [reportId]
    );

    if (reportExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or expired',
      });
    }

    // Cannot vote on own report
    if (reportExists.rows[0].user_id === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot vote on your own report',
      });
    }

    // Upsert vote
    await query(
      `INSERT INTO live_report_votes (report_id, user_id, is_confirmation)
       VALUES ($1, $2, $3)
       ON CONFLICT (report_id, user_id)
       DO UPDATE SET is_confirmation = $3`,
      [reportId, userId, isConfirmation]
    );

    // Update report counters
    const counts = await query(
      `SELECT
        COUNT(*) FILTER (WHERE is_confirmation = TRUE) as confirmations,
        COUNT(*) FILTER (WHERE is_confirmation = FALSE) as denials
       FROM live_report_votes
       WHERE report_id = $1`,
      [reportId]
    );

    await query(
      `UPDATE live_reports
       SET confirmations = $2, denials = $3, updated_at = NOW()
       WHERE id = $1`,
      [reportId, counts.rows[0].confirmations, counts.rows[0].denials]
    );

    // Auto-deactivate if too many denials
    if (counts.rows[0].denials >= 5 && counts.rows[0].denials > counts.rows[0].confirmations * 2) {
      await query(
        'UPDATE live_reports SET is_active = FALSE WHERE id = $1',
        [reportId]
      );
    }

    res.json({
      success: true,
      message: isConfirmation ? 'Report confirmed' : 'Report denied',
      data: {
        confirmations: parseInt(counts.rows[0].confirmations),
        denials: parseInt(counts.rows[0].denials),
      },
    });
  } catch (error) {
    console.error('Vote report error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to vote on report',
    });
  }
};

/**
 * Delete own report
 * DELETE /api/v1/reports/:reportId
 */
const deleteReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reportId } = req.params;

    const result = await query(
      'UPDATE live_reports SET is_active = FALSE WHERE id = $1 AND user_id = $2 RETURNING id',
      [reportId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or not authorized',
      });
    }

    res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Delete report error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to delete report',
    });
  }
};

/**
 * Get my reports
 * GET /api/v1/reports/mine
 */
const getMyReports = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT id, report_type, description, severity, photo_url,
              confirmations, denials, is_active, expires_at, created_at,
              ST_Y(location::geometry) as latitude,
              ST_X(location::geometry) as longitude
       FROM live_reports
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get my reports error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reports',
    });
  }
};

module.exports = {
  createReport,
  getReports,
  getReport,
  voteReport,
  deleteReport,
  getMyReports,
};
