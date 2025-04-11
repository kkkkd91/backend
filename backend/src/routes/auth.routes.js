const express = require('express');
const passport = require('passport');
const { check } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register validation middleware
const registerValidation = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 8 characters').isLength({ min: 8 })
];

// Login validation middleware
const loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

// Reset password validation middleware
const resetPasswordValidation = [
  check('password', 'Password must be at least 8 characters').isLength({ min: 8 })
];

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, authController.resetPassword);

// OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', authController.googleCallback);

router.get('/linkedin', passport.authenticate('linkedin'));
router.get('/linkedin/callback', authController.linkedinCallback);

// Protected routes
router.get('/me', protect, authController.getMe);
router.post('/verify-email', protect, authController.verifyEmail);
router.post('/resend-verification', protect, authController.resendVerification);

module.exports = router; 