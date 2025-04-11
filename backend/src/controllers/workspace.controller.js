const Workspace = require('../models/workspace.model');
const User = require('../models/user.model');
const tokenService = require('../services/token.service');
const emailService = require('../services/email.service');

/**
 * Get all workspaces for current user
 * @route GET /api/workspaces
 * @access Private
 */
exports.getWorkspaces = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Find all workspaces where user is owner or member
    const workspaces = await Workspace.findWorkspacesForUser(userId);
    
    res.status(200).json({
      success: true,
      data: {
        workspaces: workspaces.map(workspace => ({
          id: workspace._id,
          name: workspace.name,
          type: workspace.type,
          isOwner: workspace.owner.toString() === userId.toString(),
          createdAt: workspace.createdAt,
          // Only include members count for team workspaces
          membersCount: workspace.type === 'team' ? 
            workspace.members.filter(m => m.inviteAccepted).length : 
            undefined
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get workspace by ID
 * @route GET /api/workspaces/:workspaceId
 * @access Private
 */
exports.getWorkspace = async (req, res, next) => {
  try {
    // Workspace is already attached to req by workspace access middleware
    const workspace = req.workspace;
    const userId = req.user._id;
    
    let workspaceData = {
      id: workspace._id,
      name: workspace.name,
      type: workspace.type,
      owner: workspace.owner,
      isOwner: workspace.owner.toString() === userId.toString(),
      createdAt: workspace.createdAt,
      settings: workspace.settings
    };
    
    // Only include members for team workspaces
    if (workspace.type === 'team') {
      // Get user details for each member
      const memberIds = workspace.members.map(member => member.user);
      const users = await User.find({ _id: { $in: memberIds } });
      
      const membersData = workspace.members.map(member => {
        const userData = users.find(u => u._id.toString() === member.user.toString());
        
        return {
          id: member._id,
          userId: member.user,
          name: userData ? `${userData.firstName} ${userData.lastName}` : 'Unknown User',
          email: userData ? userData.email : 'unknown@email.com',
          role: member.role,
          inviteAccepted: member.inviteAccepted,
          addedAt: member.createdAt
        };
      });
      
      workspaceData.members = membersData;
    }
    
    res.status(200).json({
      success: true,
      data: {
        workspace: workspaceData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new workspace
 * @route POST /api/workspaces
 * @access Private
 */
exports.createWorkspace = async (req, res, next) => {
  try {
    const { name, type } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required'
      });
    }
    
    if (!['individual', 'team'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workspace type'
      });
    }
    
    // Create workspace
    const workspace = await Workspace.create({
      name,
      type,
      owner: userId
    });
    
    res.status(201).json({
      success: true,
      data: {
        workspace: {
          id: workspace._id,
          name: workspace.name,
          type: workspace.type,
          isOwner: true,
          createdAt: workspace.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update workspace
 * @route PUT /api/workspaces/:workspaceId
 * @access Private (Admin only)
 */
exports.updateWorkspace = async (req, res, next) => {
  try {
    // Only workspace admins can update workspace
    if (!req.isWorkspaceAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this workspace'
      });
    }
    
    const { name, settings } = req.body;
    const workspaceId = req.workspace._id;
    
    // Validate input
    if (!name && !settings) {
      return res.status(400).json({
        success: false,
        error: 'Name or settings are required for update'
      });
    }
    
    // Prepare update object
    const updateData = {};
    if (name) updateData.name = name;
    
    if (settings) {
      // Validate settings
      if (settings.preferredTheme && !['light', 'dark'].includes(settings.preferredTheme)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid theme preference'
        });
      }
      
      if (settings.defaultPostStyle && 
          !['standard', 'formatted', 'chunky', 'short', 'emojis'].includes(settings.defaultPostStyle)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid post style'
        });
      }
      
      if (settings.defaultLanguage && !['english', 'german'].includes(settings.defaultLanguage)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid language'
        });
      }
      
      // Update specific settings
      if (settings.preferredTheme) updateData['settings.preferredTheme'] = settings.preferredTheme;
      if (settings.defaultPostStyle) updateData['settings.defaultPostStyle'] = settings.defaultPostStyle;
      if (settings.defaultLanguage) updateData['settings.defaultLanguage'] = settings.defaultLanguage;
    }
    
    // Update workspace
    const workspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      updateData,
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      data: {
        workspace: {
          id: workspace._id,
          name: workspace.name,
          type: workspace.type,
          settings: workspace.settings
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete workspace
 * @route DELETE /api/workspaces/:workspaceId
 * @access Private (Owner only)
 */
exports.deleteWorkspace = async (req, res, next) => {
  try {
    // Only workspace owner can delete workspace
    if (!req.isWorkspaceOwner) {
      return res.status(403).json({
        success: false,
        error: 'Only the workspace owner can delete a workspace'
      });
    }
    
    const workspaceId = req.workspace._id;
    
    // Delete workspace
    await Workspace.findByIdAndDelete(workspaceId);
    
    res.status(200).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Invite user to workspace
 * @route POST /api/workspaces/:workspaceId/invite
 * @access Private (Admin only)
 */
exports.inviteUser = async (req, res, next) => {
  try {
    // Only workspace admins can invite users
    if (!req.isWorkspaceAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to invite users to this workspace'
      });
    }
    
    const { email, role } = req.body;
    const workspace = req.workspace;
    const inviter = req.user;
    
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    if (!role || !['admin', 'writer', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Valid role is required (admin, writer, or viewer)'
      });
    }
    
    // Check if workspace is team type
    if (workspace.type !== 'team') {
      return res.status(400).json({
        success: false,
        error: 'Cannot invite users to individual workspace'
      });
    }
    
    // Check if user is already a member
    const existingMember = workspace.members.find(
      member => member.user.email === email || member.email === email
    );
    
    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this workspace'
      });
    }
    
    // Find the user by email
    let user = await User.findOne({ email });
    
    // Generate invitation token
    const inviteToken = tokenService.generateInviteToken();
    
    // Add member to workspace
    const newMember = {
      user: user ? user._id : null,
      role,
      inviteAccepted: false,
      inviteToken,
      addedBy: inviter._id
    };
    
    workspace.members.push(newMember);
    await workspace.save();
    
    // Send invitation email
    await emailService.sendWorkspaceInvitation(
      email,
      inviteToken,
      workspace.name,
      `${inviter.firstName} ${inviter.lastName}`,
      role
    );
    
    res.status(200).json({
      success: true,
      data: {
        message: `Invitation sent to ${email}`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept workspace invitation
 * @route POST /api/workspaces/invitations/:token/accept
 * @access Public
 */
exports.acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    // Find workspace with this invitation token
    const workspace = await Workspace.findOne({
      'members.inviteToken': token
    });
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation'
      });
    }
    
    // Find the invitation
    const memberIndex = workspace.members.findIndex(
      member => member.inviteToken === token
    );
    
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation'
      });
    }
    
    // Update invitation
    workspace.members[memberIndex].inviteAccepted = true;
    workspace.members[memberIndex].inviteToken = undefined;
    
    // If user is logged in, associate with this invitation
    if (req.user) {
      workspace.members[memberIndex].user = req.user._id;
    }
    
    await workspace.save();
    
    res.status(200).json({
      success: true,
      data: {
        workspace: {
          id: workspace._id,
          name: workspace.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
}; 