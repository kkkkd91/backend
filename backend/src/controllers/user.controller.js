const User = require('../models/user.model');
const { validationResult } = require('express-validator');

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    // Find and update user
    const user = await User.findById(req.user._id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

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
 * Update user password
 * @route PUT /api/users/password
 * @access Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    // Find user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check if user has a password (could be OAuth user)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: 'Your account was created using social login and does not have a password',
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Return response
    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update onboarding status
 * @route PUT /api/users/onboarding
 * @access Private
 */
exports.updateOnboarding = async (req, res, next) => {
  try {
    const { step, status } = req.body;

    // Find user
    const user = await User.findById(req.user._id);

    // Update onboarding data
    if (step) user.onboardingStep = step;
    if (status) user.onboardingStatus = status;

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