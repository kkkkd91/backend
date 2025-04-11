const User = require('../models/user.model');
const Workspace = require('../models/workspace.model');

/**
 * Update current onboarding step
 * @route PUT /api/users/onboarding/step
 * @access Private
 */
exports.updateOnboardingStep = async (req, res, next) => {
  try {
    const { step } = req.body;
    const userId = req.user._id;

    // Check if step is valid
    if (!step || isNaN(step) || step < 1 || step > 9) {
      return res.status(400).json({
        success: false,
        error: 'Invalid step value'
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { onboardingStep: step },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        currentStep: user.onboardingStep
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update workspace type
 * @route PUT /api/users/onboarding/workspace-type
 * @access Private
 */
exports.updateWorkspaceType = async (req, res, next) => {
  try {
    const { workspaceType } = req.body;
    const userId = req.user._id;

    // Check if workspace type is valid
    if (!workspaceType || !['team', 'individual'].includes(workspaceType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workspace type'
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { 'onboardingData.workspaceType': workspaceType },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        workspaceType: user.onboardingData.workspaceType
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update preferred theme
 * @route PUT /api/users/onboarding/preferred-theme
 * @access Private
 */
exports.updatePreferredTheme = async (req, res, next) => {
  try {
    const { preferredTheme } = req.body;
    const userId = req.user._id;

    // Check if theme is valid
    if (!preferredTheme || !['light', 'dark'].includes(preferredTheme)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid theme'
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { 'onboardingData.preferredTheme': preferredTheme },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        preferredTheme: user.onboardingData.preferredTheme
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update post style
 * @route PUT /api/users/onboarding/post-style
 * @access Private
 */
exports.updatePostStyle = async (req, res, next) => {
  try {
    const { postStyle } = req.body;
    const userId = req.user._id;

    // Check if post style is valid
    const validStyles = ['standard', 'formatted', 'chunky', 'short', 'emojis'];
    if (!postStyle || !validStyles.includes(postStyle)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid post style'
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { 'onboardingData.postStyle': postStyle },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        postStyle: user.onboardingData.postStyle
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update post frequency
 * @route PUT /api/users/onboarding/post-frequency
 * @access Private
 */
exports.updatePostFrequency = async (req, res, next) => {
  try {
    const { postFrequency } = req.body;
    const userId = req.user._id;

    // Check if post frequency is valid
    if (!postFrequency || isNaN(postFrequency) || postFrequency < 1 || postFrequency > 30) {
      return res.status(400).json({
        success: false,
        error: 'Invalid post frequency'
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { 'onboardingData.postFrequency': postFrequency },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        postFrequency: user.onboardingData.postFrequency
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update language preference
 * @route PUT /api/users/onboarding/language
 * @access Private
 */
exports.updateLanguage = async (req, res, next) => {
  try {
    const { language } = req.body;
    const userId = req.user._id;

    // Check if language is valid
    if (!language || !['english', 'german'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid language'
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { 'onboardingData.language': language },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        language: user.onboardingData.language
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user information
 * @route PUT /api/users/onboarding/user-info
 * @access Private
 */
exports.updateUserInfo = async (req, res, next) => {
  try {
    const { firstName, lastName, mobileNumber } = req.body;
    const userId = req.user._id;

    // Check if required fields are provided
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required'
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        firstName,
        lastName,
        mobileNumber: mobileNumber || ''
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update website link
 * @route PUT /api/users/onboarding/website-link
 * @access Private
 */
exports.updateWebsiteLink = async (req, res, next) => {
  try {
    const { websiteLink } = req.body;
    const userId = req.user._id;

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { 'onboardingData.websiteLink': websiteLink || '' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        websiteLink: user.onboardingData.websiteLink
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update inspiration profiles
 * @route PUT /api/users/onboarding/inspiration-profiles
 * @access Private
 */
exports.updateInspirationProfiles = async (req, res, next) => {
  try {
    const { inspirationProfiles } = req.body;
    const userId = req.user._id;

    // Check if inspiration profiles is an array
    if (!Array.isArray(inspirationProfiles)) {
      return res.status(400).json({
        success: false,
        error: 'Inspiration profiles must be an array'
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { 'onboardingData.inspirationProfiles': inspirationProfiles },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        inspirationProfiles: user.onboardingData.inspirationProfiles
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete onboarding and create workspace
 * @route POST /api/users/onboarding/complete
 * @access Private
 */
exports.completeOnboarding = async (req, res, next) => {
  try {
    const { workspaceName } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if workspace name is provided
    if (!workspaceName) {
      return res.status(400).json({
        success: false,
        error: 'Workspace name is required'
      });
    }

    // Check if onboarding data is complete
    const { workspaceType } = user.onboardingData;
    if (!workspaceType) {
      return res.status(400).json({
        success: false,
        error: 'Workspace type is required'
      });
    }

    // Create workspace
    const workspace = await Workspace.create({
      name: workspaceName,
      type: workspaceType,
      owner: userId,
      settings: {
        preferredTheme: user.onboardingData.preferredTheme || 'light',
        defaultPostStyle: user.onboardingData.postStyle || 'standard',
        defaultLanguage: user.onboardingData.language || 'english',
      }
    });

    // Update user onboarding status
    user.onboardingStatus = 'completed';
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        workspace: {
          id: workspace._id,
          name: workspace.name,
          type: workspace.type
        },
        onboardingStatus: user.onboardingStatus
      }
    });
  } catch (error) {
    next(error);
  }
}; 