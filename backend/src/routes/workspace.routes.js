const express = require('express');
const { check } = require('express-validator');
const workspaceController = require('../controllers/workspace.controller');
const { protect, workspaceAccess, requireWorkspaceAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all workspaces for current user
router.get('/', workspaceController.getWorkspaces);

// Create a new workspace
router.post(
  '/',
  [
    check('name', 'Workspace name is required').notEmpty(),
    check('type', 'Workspace type is required').isIn(['individual', 'team'])
  ],
  workspaceController.createWorkspace
);

// Routes that require workspace access
router.get('/:workspaceId', workspaceAccess, workspaceController.getWorkspace);
router.put('/:workspaceId', [workspaceAccess, requireWorkspaceAdmin], workspaceController.updateWorkspace);
router.delete('/:workspaceId', workspaceAccess, workspaceController.deleteWorkspace);

// Workspace invitation routes
router.post(
  '/:workspaceId/invite',
  [
    workspaceAccess,
    requireWorkspaceAdmin,
    check('email', 'Valid email is required').isEmail(),
    check('role', 'Valid role is required').isIn(['admin', 'writer', 'viewer'])
  ],
  workspaceController.inviteUser
);

// Accept workspace invitation - doesn't require authentication
router.post('/invitations/:token/accept', workspaceController.acceptInvitation);

module.exports = router; 