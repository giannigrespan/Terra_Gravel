/**
 * Email Service
 * Supports SendGrid, AWS SES, and Nodemailer (SMTP)
 * Configure via environment variables
 */

const nodemailer = require('nodemailer');

// Email provider configuration
const getTransporter = () => {
  const provider = process.env.EMAIL_PROVIDER || 'smtp';

  switch (provider) {
    case 'sendgrid':
      // SendGrid via SMTP
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });

    case 'ses':
      // AWS SES
      return nodemailer.createTransport({
        host: process.env.AWS_SES_HOST || 'email-smtp.eu-central-1.amazonaws.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.AWS_SES_USER,
          pass: process.env.AWS_SES_PASS,
        },
      });

    case 'smtp':
    default:
      // Generic SMTP (Gmail, Outlook, etc.)
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
  }
};

// Lazy-load transporter
let transporter = null;
const getMailer = () => {
  if (!transporter) {
    transporter = getTransporter();
  }
  return transporter;
};

// Default sender
const defaultFrom = process.env.EMAIL_FROM || 'TerraGravel <noreply@terragravel.app>';

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body (optional)
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Skip in test environment
    if (process.env.NODE_ENV === 'test') {
      console.log(`[TEST] Email to ${to}: ${subject}`);
      return { success: true, messageId: 'test-message-id' };
    }

    // Check if email is configured
    if (!process.env.SMTP_USER && !process.env.SENDGRID_API_KEY && !process.env.AWS_SES_USER) {
      console.warn('[EMAIL] No email provider configured. Email not sent.');
      return { success: false, error: 'Email not configured' };
    }

    const mailer = getMailer();
    const result = await mailer.sendMail({
      from: defaultFrom,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log(`[EMAIL] Sent to ${to}: ${subject} (${result.messageId})`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[EMAIL] Failed to send:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, token, username) => {
  const resetUrl = `${process.env.APP_URL || 'https://terragravel.app'}/reset-password?token=${token}`;

  const subject = 'Reset your TerraGravel password';

  const text = `
Hi ${username || 'Cyclist'},

You requested to reset your password for TerraGravel.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Ride safe!
The TerraGravel Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚴 TerraGravel</h1>
    </div>
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>Hi ${username || 'Cyclist'},</p>
      <p>You requested to reset your password. Click the button below to create a new password:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>
      <p>This link will expire in <strong>1 hour</strong>.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>Ride safe!<br>The TerraGravel Team</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TerraGravel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send email verification email
 */
const sendVerificationEmail = async (email, token, username) => {
  const verifyUrl = `${process.env.APP_URL || 'https://terragravel.app'}/verify-email?token=${token}`;

  const subject = 'Verify your TerraGravel email';

  const text = `
Hi ${username || 'Cyclist'},

Welcome to TerraGravel! Please verify your email address.

Click this link to verify:
${verifyUrl}

This link will expire in 24 hours.

Ride safe!
The TerraGravel Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚴 TerraGravel</h1>
    </div>
    <div class="content">
      <h2>Welcome to TerraGravel!</h2>
      <p>Hi ${username || 'Cyclist'},</p>
      <p>Thanks for signing up! Please verify your email address to get started:</p>
      <p style="text-align: center;">
        <a href="${verifyUrl}" class="button">Verify Email</a>
      </p>
      <p>This link will expire in <strong>24 hours</strong>.</p>
      <p>Ride safe!<br>The TerraGravel Team</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TerraGravel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send new match notification email
 */
const sendMatchNotificationEmail = async (email, username, matchUsername) => {
  const subject = `You have a new match on TerraGravel! 🎉`;

  const text = `
Hi ${username},

Great news! You matched with ${matchUsername} on TerraGravel.

Open the app to start chatting and plan your next ride together!

Ride safe!
The TerraGravel Team
  `.trim();

  return sendEmail({ to: email, subject, text });
};

/**
 * Send ride reminder email
 */
const sendRideReminderEmail = async (email, username, rideDetails) => {
  const subject = `Ride reminder: ${rideDetails.name || 'Upcoming ride'}`;

  const text = `
Hi ${username},

Reminder: You have a ride scheduled!

${rideDetails.name || 'Ride'}
Date: ${rideDetails.date}
${rideDetails.location ? `Location: ${rideDetails.location}` : ''}

Don't forget to check the weather and your gear!

Ride safe!
The TerraGravel Team
  `.trim();

  return sendEmail({ to: email, subject, text });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendMatchNotificationEmail,
  sendRideReminderEmail,
};
