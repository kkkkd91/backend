const nodemailer = require('nodemailer');

/**
 * Create transporter for sending emails
 */
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send verification email with code
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} code - Verification code
 * @returns {Promise} - Nodemailer info object
 */
exports.sendVerificationEmail = async (to, name, code) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Verify Your Email - Social Scribe',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Welcome to Social Scribe!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering. Please verify your email with this code:</p>
        <div style="background-color: #f7f7f7; padding: 10px; font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 5px;">
          ${code}
        </div>
        <p>This code will expire in 1 hour.</p>
        <p>If you didn't register for Social Scribe, please ignore this email.</p>
        <p>Best regards,<br>The Social Scribe Team</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise} - Nodemailer info object
 */
exports.sendPasswordResetEmail = async (to, name, resetUrl) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Reset Your Password - Social Scribe',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Reset Your Password</h2>
        <p>Hello ${name},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email or contact support.</p>
        <p>Best regards,<br>The Social Scribe Team</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}; 