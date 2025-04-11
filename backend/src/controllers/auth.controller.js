const User = require('../models/user.model');
const tokenService = require('../services/token.service');
const emailService = require('../services/email.service');
const passport = require('passport');

/**
 * Register a new user with email and password
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email is already registered'
      });
    }

    // Generate verification code
    const verificationCode = tokenService.generateVerificationCode();
    
    // Set expiration time (30 minutes from now)
    const verificationExpires = new Date();
    verificationExpires.setMinutes(verificationExpires.getMinutes() + 30);

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires
    });

    // Send verification email
    await emailService.sendVerificationCode(
      email,
      verificationCode,
      firstName
    );

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user._id);
    const refreshToken = tokenService.generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          emailVerified: user.emailVerified,
          onboardingStatus: user.onboardingStatus,
          onboardingStep: user.onboardingStep
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email with code
 * @route POST /api/auth/verify-email
 * @access Private
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;

    // Get user with verification code
    const user = await User.findById(userId).select('+emailVerificationCode +emailVerificationExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if verification code matches
    if (user.emailVerificationCode !== code) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }

    // Check if verification code is expired
    if (user.emailVerificationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Verification code expired'
      });
    }

    // Update user
    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          emailVerified: user.emailVerified,
          onboardingStatus: user.onboardingStatus,
          onboardingStep: user.onboardingStep
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend email verification code
 * @route POST /api/auth/resend-verification
 * @access Private
 */
exports.resendVerification = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Generate new verification code
    const verificationCode = tokenService.generateVerificationCode();
    
    // Set expiration time (30 minutes from now)
    const verificationExpires = new Date();
    verificationExpires.setMinutes(verificationExpires.getMinutes() + 30);

    // Update user
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    await emailService.sendVerificationCode(
      user.email,
      verificationCode,
      user.firstName
    );

    res.status(200).json({
      success: true,
      message: 'Verification code sent'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login with email and password
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user._id);
    const refreshToken = tokenService.generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          emailVerified: user.emailVerified,
          onboardingStatus: user.onboardingStatus,
          onboardingStep: user.onboardingStep
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current logged in user
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          emailVerified: user.emailVerified,
          onboardingStatus: user.onboardingStatus,
          onboardingStep: user.onboardingStep,
          onboardingData: user.onboardingData
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal that email doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = tokenService.generateResetToken();
    const hashedToken = tokenService.hashToken(resetToken);

    // Set expiration time (1 hour from now)
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    // Update user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send password reset email
    await emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.firstName
    );

    res.status(200).json({
      success: true,
      message: 'If the email exists, a reset link has been sent'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash token
    const hashedToken = tokenService.hashToken(token);

    // Find user with reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = tokenService.verifyToken(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const accessToken = tokenService.generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth callback
 * @route GET /api/auth/google/callback
 * @access Public
 */
exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user._id);
    const refreshToken = tokenService.generateRefreshToken(user._id);

    // Redirect to frontend with tokens
    res.redirect(
      `${process.env.FRONTEND_URL}/oauth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  })(req, res, next);
};

/**
 * LinkedIn OAuth callback
 * @route GET /api/auth/linkedin/callback
 * @access Public
 */
exports.linkedinCallback = (req, res, next) => {
  passport.authenticate('linkedin', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user._id);
    const refreshToken = tokenService.generateRefreshToken(user._id);

    // Redirect to frontend with tokens
    res.redirect(
      `${process.env.FRONTEND_URL}/oauth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  })(req, res, next);
}; 