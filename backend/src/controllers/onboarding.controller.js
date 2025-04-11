const User = require('../models/user.model');
const Workspace = require('../models/workspace.model');
const { validationResult } = require('express-validator');

/**
 * Get onboarding status
 * @route GET /api/onboarding/status
 * @access Private
 */
exports.getOnboardingStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        onboardingStatus: user.onboardingStatus,
        currentStep: user.onboardingStep || 1,
        totalSteps: 9
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update onboarding step
 * @route PUT /api/onboarding/step
 * @access Private
 */
exports.updateStep = async (req, res, next) => {
  try {
    const { step } = req.body;

    if (!step) {
      return res.status(400).json({
        success: false,
        error: 'Step is required',
      });
    }

    // Find user
    const user = await User.findById(req.user._id);

    // Update step
    user.onboardingStep = step;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        currentStep: user.onboardingStep,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update workspace type
 * @route PUT /api/onboarding/workspace-type
 * @access Private
 */
exports.updateWorkspaceType = async (req, res, next) => {
  try {
    const { workspaceType } = req.body;

    if (!workspaceType || !['team', 'individual'].includes(workspaceType)) {
      return res.status(400).json({
        success: false,
        error: 'Valid workspace type is required',
      });
    }

    // Find user
    const user = await User.findById(req.user._id);

    // Store in user preferences
    if (!user.preferences) {
      user.preferences = {};
    }
    user.preferences.workspaceType = workspaceType;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        workspaceType,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update post style
 * @route PUT /api/onboarding/post-style
 * @access Private
 */
exports.updatePostStyle = async (req, res, next) => {
  try {
    const { postStyle } = req.body;

    if (!postStyle || !['standard', 'formatted', 'chunky', 'short', 'emojis'].includes(postStyle)) {
      return res.status(400).json({
        success: false,
        error: 'Valid post style is required',
      });
    }

    // Find user
    const user = await User.findById(req.user._id);

    // Store in user preferences
    if (!user.preferences) {
      user.preferences = {};
    }
    user.preferences.postStyle = postStyle;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        postStyle,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update post frequency
 * @route PUT /api/onboarding/post-frequency
 * @access Private
 */
exports.updatePostFrequency = async (req, res, next) => {
  try {
    const { postFrequency } = req.body;

    if (postFrequency === undefined || postFrequency === null || postFrequency < 1 || postFrequency > 7) {
      return res.status(400).json({
        success: false,
        error: 'Valid post frequency (1-7) is required',
      });
    }

    // Find user
    const user = await User.findById(req.user._id);

    // Store in user preferences
    if (!user.preferences) {
      user.preferences = {};
    }
    user.preferences.postFrequency = postFrequency;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        postFrequency,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user info
 * @route PUT /api/onboarding/user-info
 * @access Private
 */
exports.updateUserInfo = async (req, res, next) => {
  try {
    const { firstName, lastName, mobileNumber } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required',
      });
    }

    // Find user
    const user = await User.findById(req.user._id);

    // Update user info
    user.firstName = firstName;
    user.lastName = lastName;
    if (mobileNumber) {
      user.mobileNumber = mobileNumber;
    }
    
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update website link
 * @route PUT /api/onboarding/website-link
 * @access Private
 */
exports.updateWebsiteLink = async (req, res, next) => {
  try {
    const { websiteLink } = req.body;

    // Find user
    const user = await User.findById(req.user._id);

    // Store in user preferences
    if (!user.preferences) {
      user.preferences = {};
    }
    user.preferences.websiteLink = websiteLink;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        websiteLink,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update inspiration profiles
 * @route PUT /api/onboarding/inspiration-profiles
 * @access Private
 */
exports.updateInspirationProfiles = async (req, res, next) => {
  try {
    const { inspirationProfiles } = req.body;

    if (!Array.isArray(inspirationProfiles)) {
      return res.status(400).json({
        success: false,
        error: 'Inspiration profiles must be an array',
      });
    }

    // Find user
    const user = await User.findById(req.user._id);

    // Store in user preferences
    if (!user.preferences) {
      user.preferences = {};
    }
    user.preferences.inspirationProfiles = inspirationProfiles;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        inspirationProfiles,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete onboarding and create workspace
 * @route POST /api/onboarding/complete
 * @access Private
 */
exports.completeOnboarding = async (req, res, next) => {
  try {
    const { workspaceName } = req.body;

    // Validate workspaceName
    if (!workspaceName || !workspaceName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Workspace name is required',
      });
    }

    // Find user
    const user = await User.findById(req.user._id);
    const workspaceType = user.preferences?.workspaceType || 'individual';
    const postFrequency = user.preferences?.postFrequency ? 
      ['daily', 'weekly', 'biweekly', 'monthly'][Math.min(Math.floor(user.preferences.postFrequency / 2), 3)] : 'weekly';
    const postStyle = user.preferences?.postStyle || 'standard';
    const inspirationProfiles = user.preferences?.inspirationProfiles || [];
    const websiteLink = user.preferences?.websiteLink || '';

    // Create workspace
    const workspace = await Workspace.create({
      name: workspaceName,
      type: workspaceType,
      owner: user._id,
      linkedInProfile: websiteLink,
      postFrequency,
      postStyle, 
      inspirationProfiles,
      members: [
        {
          user: user._id,
          role: 'admin',
        },
      ],
    });

    // Update user's onboarding status
    user.onboardingStatus = 'completed';
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        workspace: {
          id: workspace._id,
          name: workspace.name,
          type: workspace.type
        },
        onboardingStatus: user.onboardingStatus
      },
    });
  } catch (error) {
    next(error);
  }
}; 