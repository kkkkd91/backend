const Workspace = require('../models/workspace.model');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');

/**
 * Create a new workspace
 * @route POST /api/workspaces
 * @access Private
 */
exports.createWorkspace = async (req, res, next) => {
  try {
    const { name, type, linkedInProfile, postFrequency, postStyle, inspirationProfiles } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    // Create workspace
    const workspace = await Workspace.create({
      name,
      type,
      owner: req.user._id,
      linkedInProfile,
      postFrequency,
      postStyle,
      inspirationProfiles,
      members: [
        {
          user: req.user._id,
          role: 'admin',
        },
      ],
    });

    // Check if this is the user's first workspace and update onboarding status
    if (req.user.onboardingStatus !== 'completed') {
      const user = await User.findById(req.user._id);
      user.onboardingStatus = 'completed';
      await user.save();
    }

    // Return response
    res.status(201).json({
      success: true,
      data: {
        workspace,
        user: {
          onboardingStatus: req.user.onboardingStatus === 'completed' ? 
            'completed' : 'incomplete'
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all workspaces for the current user
 * @route GET /api/workspaces
 * @access Private
 */
exports.getWorkspaces = async (req, res, next) => {
  try {
    // Find workspaces where user is owner or member
    const workspaces = await Workspace.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
      ],
    });

    // Return response
    res.status(200).json({
      success: true,
      data: {
        workspaces,
        count: workspaces.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single workspace by ID
 * @route GET /api/workspaces/:id
 * @access Private
 */
exports.getWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
      });
    }

    // Check if user has access to workspace
    const hasAccess = workspace.owner.equals(req.user._id) || 
                      workspace.members.some(member => member.user.equals(req.user._id));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this workspace',
      });
    }

    // Return response
    res.status(200).json({
      success: true,
      data: {
        workspace,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a workspace
 * @route PUT /api/workspaces/:id
 * @access Private
 */
exports.updateWorkspace = async (req, res, next) => {
  try {
    const { name, linkedInProfile, postFrequency, postStyle, inspirationProfiles } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    // Find workspace
    let workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
      });
    }

    // Check if user is owner or admin
    const isOwnerOrAdmin = workspace.owner.equals(req.user._id) || 
                          workspace.members.some(member => 
                            member.user.equals(req.user._id) && member.role === 'admin');

    if (!isOwnerOrAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You must be the owner or admin to update this workspace',
      });
    }

    // Update workspace
    if (name) workspace.name = name;
    if (linkedInProfile) workspace.linkedInProfile = linkedInProfile;
    if (postFrequency) workspace.postFrequency = postFrequency;
    if (postStyle) workspace.postStyle = postStyle;
    if (inspirationProfiles) workspace.inspirationProfiles = inspirationProfiles;

    await workspace.save();

    // Return response
    res.status(200).json({
      success: true,
      data: {
        workspace,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a workspace
 * @route DELETE /api/workspaces/:id
 * @access Private
 */
exports.deleteWorkspace = async (req, res, next) => {
  try {
    // Find workspace
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
      });
    }

    // Check if user is owner
    if (!workspace.owner.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Only the workspace owner can delete it',
      });
    }

    // Delete workspace
    await Workspace.deleteOne({ _id: workspace._id });

    // Return response
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a member to a workspace
 * @route POST /api/workspaces/:id/members
 * @access Private
 */
exports.addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email and role are required',
      });
    }

    // Find workspace
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
      });
    }

    // Check if user is owner or admin
    const isOwnerOrAdmin = workspace.owner.equals(req.user._id) || 
                          workspace.members.some(member => 
                            member.user.equals(req.user._id) && member.role === 'admin');

    if (!isOwnerOrAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You must be the owner or admin to add members',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user is already a member
    const isMember = workspace.members.some(member => member.user.equals(user._id));
    
    if (isMember) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this workspace',
      });
    }

    // Add user to workspace
    workspace.members.push({
      user: user._id,
      role: role,
    });

    await workspace.save();

    // Return response
    res.status(200).json({
      success: true,
      data: {
        workspace,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a member from a workspace
 * @route DELETE /api/workspaces/:id/members/:userId
 * @access Private
 */
exports.removeMember = async (req, res, next) => {
  try {
    // Find workspace
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
      });
    }

    // Check if user is owner or admin
    const isOwnerOrAdmin = workspace.owner.equals(req.user._id) || 
                          workspace.members.some(member => 
                            member.user.equals(req.user._id) && member.role === 'admin');

    if (!isOwnerOrAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You must be the owner or admin to remove members',
      });
    }

    // Check if trying to remove owner
    if (workspace.owner.equals(req.params.userId)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove the workspace owner',
      });
    }

    // Remove member
    workspace.members = workspace.members.filter(
      member => !member.user.equals(req.params.userId)
    );

    await workspace.save();

    // Return response
    res.status(200).json({
      success: true,
      data: {
        workspace,
      },
    });
  } catch (error) {
    next(error);
  }
}; 