const passport = require('passport');
const Workspace = require('../models/workspace.model');

/**
 * Middleware to protect routes that require authentication
 */
exports.protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Please log in to access this resource'
      });
    }

    // Add user to request
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware to check if user has completed onboarding
 */
exports.requireOnboarding = (req, res, next) => {
  if (req.user.onboardingStatus !== 'completed') {
    return res.status(403).json({
      success: false,
      error: 'Please complete onboarding before accessing this resource',
      onboardingRequired: true,
      currentStep: req.user.onboardingStep
    });
  }
  next();
};

/**
 * Middleware to check if user can access a workspace
 */
exports.workspaceAccess = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'Workspace ID is required'
      });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Check if user is owner or member
    const isOwner = workspace.owner.toString() === req.user._id.toString();
    
    if (isOwner) {
      req.workspace = workspace;
      req.isWorkspaceOwner = true;
      req.isWorkspaceAdmin = true;
      return next();
    }

    // For team workspaces, check if user is a member
    if (workspace.type === 'team') {
      const isMember = workspace.isMember(req.user._id);
      
      if (!isMember) {
        return res.status(403).json({
          success: false,
          error: 'You do not have access to this workspace'
        });
      }
      
      // Check if user is admin
      const isAdmin = workspace.isAdmin(req.user._id);
      
      req.workspace = workspace;
      req.isWorkspaceOwner = false;
      req.isWorkspaceAdmin = isAdmin;
      return next();
    } else {
      // Individual workspaces can only be accessed by owner
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this workspace'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is workspace admin
 */
exports.requireWorkspaceAdmin = (req, res, next) => {
  if (!req.isWorkspaceAdmin) {
    return res.status(403).json({
      success: false,
      error: 'You do not have admin access to this workspace'
    });
  }
  next();
}; 