const { query } = require('../config/database');
const crypto = require('crypto');

/**
 * Generate a secure random token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Send verification email
 * POST /api/v1/auth/send-verification
 */
const sendVerification = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user info
    const userResult = await query(
      'SELECT id, email, email_verified FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified',
      });
    }

    // Invalidate any existing tokens
    await query(
      'UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [userId]
    );

    // Generate new token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token
    await query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );

    // In production, send email here
    const verifyUrl = `terragravel://verify-email?token=${token}`;

    // TODO: Integrate email service
    console.log(`Email verification requested for ${user.email}. Token: ${token}`);

    res.json({
      success: true,
      message: 'Verification email has been sent',
      // Remove in production - only for testing
      ...(process.env.NODE_ENV === 'development' && {
        debug: { token, verifyUrl }
      }),
    });
  } catch (error) {
    console.error('Send verification error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to send verification email',
    });
  }
};

/**
 * Verify email with token
 * POST /api/v1/auth/verify-email
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Find valid token
    const tokenResult = await query(
      `SELECT evt.id, evt.user_id
       FROM email_verification_tokens evt
       WHERE evt.token = $1 AND evt.used_at IS NULL AND evt.expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token',
      });
    }

    const verifyToken = tokenResult.rows[0];

    // Mark email as verified
    await query(
      'UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1',
      [verifyToken.user_id]
    );

    // Mark token as used
    await query(
      'UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1',
      [verifyToken.id]
    );

    res.json({
      success: true,
      message: 'Email has been verified successfully',
    });
  } catch (error) {
    console.error('Verify email error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to verify email',
    });
  }
};

/**
 * Check verification status
 * GET /api/v1/auth/verification-status
 */
const getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT email_verified FROM users WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        emailVerified: result.rows[0].email_verified,
      },
    });
  } catch (error) {
    console.error('Get verification status error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get verification status',
    });
  }
};

module.exports = {
  sendVerification,
  verifyEmail,
  getVerificationStatus,
};
