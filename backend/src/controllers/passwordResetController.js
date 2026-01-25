const { query } = require('../config/database');
const { hashPassword } = require('../utils/auth');
const crypto = require('crypto');

/**
 * Generate a secure random token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Request password reset
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const userResult = await query(
      'SELECT id, email, username FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    const user = userResult.rows[0];

    // Invalidate any existing tokens for this user
    await query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [user.id]
    );

    // Generate new token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    // In production, send email here
    // For now, return token in response (dev only)
    const resetUrl = `terragravel://reset-password?token=${token}`;

    // TODO: Integrate email service (SendGrid, AWS SES, etc.)
    console.log(`Password reset requested for ${email}. Token: ${token}`);

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
      // Remove in production - only for testing
      ...(process.env.NODE_ENV === 'development' && {
        debug: { token, resetUrl }
      }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request',
    });
  }
};

/**
 * Reset password with token
 * POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find valid token
    const tokenResult = await query(
      `SELECT prt.id, prt.user_id, prt.expires_at, u.email
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1 AND prt.used_at IS NULL AND prt.expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
    }

    const resetToken = tokenResult.rows[0];

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, resetToken.user_id]
    );

    // Mark token as used
    await query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [resetToken.id]
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
    });
  }
};

/**
 * Verify reset token is valid
 * GET /api/v1/auth/verify-reset-token/:token
 */
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const result = await query(
      `SELECT id FROM password_reset_tokens
       WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [token]
    );

    res.json({
      success: true,
      data: {
        valid: result.rows.length > 0,
      },
    });
  } catch (error) {
    console.error('Verify reset token error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to verify token',
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  verifyResetToken,
};
