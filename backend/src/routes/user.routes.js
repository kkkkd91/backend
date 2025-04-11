const express = require('express');
const { check } = require('express-validator');
const onboardingController = require('../controllers/onboarding.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Onboarding routes
router.put('/onboarding/step', onboardingController.updateOnboardingStep);
router.put('/onboarding/workspace-type', onboardingController.updateWorkspaceType);
router.put('/onboarding/preferred-theme', onboardingController.updatePreferredTheme);
router.put('/onboarding/post-style', onboardingController.updatePostStyle);
router.put('/onboarding/post-frequency', onboardingController.updatePostFrequency);
router.put('/onboarding/language', onboardingController.updateLanguage);
router.put('/onboarding/user-info', onboardingController.updateUserInfo);
router.put('/onboarding/website-link', onboardingController.updateWebsiteLink);
router.put('/onboarding/inspiration-profiles', onboardingController.updateInspirationProfiles);
router.post('/onboarding/complete', onboardingController.completeOnboarding);

module.exports = router; 