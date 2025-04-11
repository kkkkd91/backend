const express = require('express');
const { check } = require('express-validator');
const onboardingController = require('../controllers/onboarding.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All onboarding routes require authentication
router.use(protect);

// Get onboarding status
router.get('/status', onboardingController.getOnboardingStatus);

// Update onboarding step
router.put('/step', onboardingController.updateStep);

// Update workspace type
router.put('/workspace-type', onboardingController.updateWorkspaceType);

// Update post style
router.put('/post-style', onboardingController.updatePostStyle);

// Update post frequency
router.put('/post-frequency', onboardingController.updatePostFrequency);

// Update user info
router.put('/user-info', [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
], onboardingController.updateUserInfo);

// Update website link
router.put('/website-link', onboardingController.updateWebsiteLink);

// Update inspiration profiles
router.put('/inspiration-profiles', onboardingController.updateInspirationProfiles);

// Complete onboarding
router.post(
  '/complete',
  [
    check('workspaceName', 'Workspace name is required').not().isEmpty(),
  ],
  onboardingController.completeOnboarding
);

module.exports = router; 