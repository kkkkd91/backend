const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/user.model');
const tokenService = require('../services/token.service');
const emailService = require('../services/email.service');
const passport = require('passport');
const jwt = require('jsonwebtoken');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
      });
    }

    // Generate verification code
    const verificationCode = tokenService.generateVerificationCode();
    const verificationExpires = Date.now() + 3600000; // 1 hour

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      verificationCode,
      verificationExpires,
      emailVerified: true, // Auto-verify for testing mode
    });

    // Send verification email - commented out for testing mode
    // await emailService.sendVerificationEmail(
    //   email,
    //   firstName,
    //   verificationCode
    // );

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user._id);
    const refreshToken = tokenService.generateRefreshToken(user._id);

    // Return response
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
          onboardingStep: user.onboardingStep,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if password exists (for OAuth users)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: 'Account was created using social login. Please use that method to login.',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user._id);
    const refreshToken = tokenService.generateRefreshToken(user._id);

    // Return response
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
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
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
        error: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = tokenService.verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    // Generate new access token
    const accessToken = tokenService.generateAccessToken(user._id);

    // Return response
    res.status(200).json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
    }
    next(error);
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

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
        },
      },
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

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required',
      });
    }

    // Find user with verification code
    const user = await User.findById(req.user._id).select('+verificationCode +verificationExpires');

    // Check if code matches and not expired
    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code',
      });
    }

    if (user.verificationExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired',
      });
    }

    // Update user
    user.emailVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Return response
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
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification code
 * @route POST /api/auth/resend-verification
 * @access Private
 */
exports.resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified',
      });
    }

    // Generate new verification code
    const verificationCode = tokenService.generateVerificationCode();
    const verificationExpires = Date.now() + 3600000; // 1 hour

    // Update user
    user.verificationCode = verificationCode;
    user.verificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      verificationCode
    );

    // Return response
    res.status(200).json({
      success: true,
      message: 'Verification code sent',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal user existence
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
      });
    }

    // Generate reset token
    const resetToken = tokenService.generateResetToken(user._id);
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Update user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    await emailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetUrl
    );

    // Return response
    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // Find user
    const user = await User.findById(decoded.id).select('+resetPasswordToken +resetPasswordExpires');
    if (!user || !user.resetPasswordToken || user.resetPasswordToken !== token) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired',
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Return response
    res.status(200).json({
      success: true,
      message: 'Password reset successful',
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
      `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`
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
      `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`
    );
  })(req, res, next);
};

/**
 * Handle OAuth callback with token
 * @route POST /api/auth/oauth/callback
 * @access Public
 */
exports.handleOAuthCallback = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Generate refresh token
    const refreshToken = tokenService.generateRefreshToken(user._id);
    
    // Return user and tokens
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
          onboardingStep: user.onboardingStep || 1
        },
        tokens: {
          accessToken: token,
          refreshToken
        }
      }
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

/**
 * Check if email exists
 * @route POST /api/auth/check-email
 * @access Public
 */
exports.checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    
    res.status(200).json({
      success: true,
      data: {
        exists: !!user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete user onboarding
 * @route PUT /api/auth/complete-onboarding
 * @access Private
 */
exports.completeOnboarding = async (req, res, next) => {
  try {
    // Update user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Mark onboarding as complete
    user.onboardingStatus = 'completed';
    await user.save();
    
    // Return response
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
        }
      }
    });
  } catch (error) {
    next(error);
  }
}; 