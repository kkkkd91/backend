const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Service for token generation and validation
 */
class TokenService {
  /**
   * Generate JWT access token
   * @param {string} userId - User ID
   * @returns {string} JWT token
   */
  generateAccessToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

  /**
   * Generate JWT refresh token
   * @param {string} userId - User ID
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @param {string} secret - Secret key
   * @returns {object} Decoded token
   */
  verifyToken(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate random verification code (4 digits)
   * @returns {string} 4-digit verification code
   */
  generateVerificationCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Generate reset password token
   * @returns {string} Reset token
   */
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate workspace invitation token
   * @returns {string} Invitation token
   */
  generateInviteToken() {
    return crypto.randomBytes(24).toString('hex');
  }

  /**
   * Hash a token using SHA-256
   * @param {string} token - Token to hash
   * @returns {string} Hashed token
   */
  hashToken(token) {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }
}

module.exports = new TokenService(); 