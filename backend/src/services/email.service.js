const nodemailer = require('nodemailer');

/**
 * Email service to handle all email communications
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Send verification code email to user
   * @param {string} to - Recipient's email
   * @param {string} code - Verification code
   * @param {string} firstName - Recipient's first name
   */
  async sendVerificationCode(to, code, firstName) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Social Scribe - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0077B5;">Verify Your Email Address</h2>
          <p>Hello ${firstName},</p>
          <p>Thank you for signing up for Social Scribe. To complete your registration, please use the following verification code:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 32px; margin: 0; letter-spacing: 5px; color: #333;">${code}</h1>
          </div>
          <p>This code will expire in 30 minutes.</p>
          <p>If you didn't sign up for Social Scribe, you can safely ignore this email.</p>
          <p>Best regards,<br>The Social Scribe Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   * @param {string} to - Recipient's email
   * @param {string} resetToken - Password reset token
   * @param {string} firstName - Recipient's first name
   */
  async sendPasswordResetEmail(to, resetToken, firstName) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Social Scribe - Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0077B5;">Reset Your Password</h2>
          <p>Hello ${firstName},</p>
          <p>You requested a password reset for your Social Scribe account. Please click the button below to reset your password:</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #0077B5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Best regards,<br>The Social Scribe Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send workspace invitation email
   * @param {string} to - Recipient's email
   * @param {string} inviteToken - Workspace invitation token
   * @param {string} workspaceName - Name of the workspace
   * @param {string} inviterName - Name of the person who sent the invitation
   * @param {string} role - Role assigned to the invitee
   */
  async sendWorkspaceInvitation(to, inviteToken, workspaceName, inviterName, role) {
    const inviteUrl = `${process.env.FRONTEND_URL}/workspace-invite/${inviteToken}`;

    const roleDisplay = {
      admin: 'Administrator',
      writer: 'Content Writer',
      viewer: 'Viewer',
    };

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: `Social Scribe - You've Been Invited to ${workspaceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0077B5;">Workspace Invitation</h2>
          <p>Hello,</p>
          <p><strong>${inviterName}</strong> has invited you to join the workspace <strong>${workspaceName}</strong> on Social Scribe as a <strong>${roleDisplay[role] || role}</strong>.</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="${inviteUrl}" style="background-color: #0077B5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Accept Invitation</a>
          </div>
          <p>This invitation link will expire in 7 days.</p>
          <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
          <p>Best regards,<br>The Social Scribe Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Workspace invitation email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Error sending workspace invitation email:', error);
      throw new Error('Failed to send workspace invitation email');
    }
  }
}

module.exports = new EmailService(); 