const express = require('express');
const { check } = require('express-validator');
const workspaceController = require('../controllers/workspace.controller');
const { protect, restrictToVerified, checkOnboarding } = require('../middleware/auth');

const router = express.Router();

// Workspace validation middleware
const workspaceValidation = [
  check('name', 'Workspace name is required').not().isEmpty(),
  check('type', 'Workspace type is required').isIn(['personal', 'business', 'agency']),
];

// All routes require authentication
router.use(protect);

// Most routes require email verification
router.use(restrictToVerified);

// Create workspace
router.post(
  '/',
  workspaceValidation,
  workspaceController.createWorkspace
);

// Get all workspaces
router.get(
  '/',
  workspaceController.getWorkspaces
);

// Get single workspace
router.get(
  '/:id',
  workspaceController.getWorkspace
);

// Update workspace
router.put(
  '/:id',
  workspaceController.updateWorkspace
);

// Delete workspace
router.delete(
  '/:id',
  workspaceController.deleteWorkspace
);

// Workspace members
router.post(
  '/:id/members',
  [
    check('email', 'Valid email is required').isEmail(),
    check('role', 'Role must be admin, editor, or viewer').isIn(['admin', 'editor', 'viewer']),
  ],
  workspaceController.addMember
);

router.delete(
  '/:id/members/:userId',
  workspaceController.removeMember
);

module.exports = router; 