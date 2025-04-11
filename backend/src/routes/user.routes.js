const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/user.controller');
const { protect, restrictToVerified } = require('../middleware/auth');

const router = express.Router();

// Update profile validation middleware
const updateProfileValidation = [
  check('firstName', 'First name cannot be empty if provided').optional().not().isEmpty(),
  check('lastName', 'Last name cannot be empty if provided').optional().not().isEmpty(),
];

// All routes require authentication
router.use(protect);

// User profile routes
router.put(
  '/profile',
  updateProfileValidation,
  userController.updateProfile
);

// Password routes
router.put(
  '/password',
  [check('newPassword', 'New password must be at least 8 characters').isLength({ min: 8 })],
  userController.updatePassword
);

// Onboarding routes
router.put(
  '/onboarding',
  userController.updateOnboarding
);

module.exports = router; 