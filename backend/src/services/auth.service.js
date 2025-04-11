const User = require('../models/user.model');
const tokenService = require('./token.service');
const bcrypt = require('bcryptjs');

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<User>} Created user
 */
exports.registerUser = async (userData) => {
  // Check if user exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Create new user
  const user = await User.create(userData);
  return user;
};

/**
 * Login a user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<User>} Authenticated user
 */
exports.loginWithEmailPassword = async (email, password) => {
  // Find user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<User>} User
 */
exports.getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

/**
 * Update user onboarding status
 * @param {string} userId - User ID
 * @param {string} status - Onboarding status ('incomplete' or 'completed')
 * @returns {Promise<User>} Updated user
 */
exports.updateOnboardingStatus = async (userId, status) => {
  if (!['incomplete', 'completed'].includes(status)) {
    throw new Error('Invalid onboarding status');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { onboardingStatus: status },
    { new: true }
  );

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Update user onboarding step
 * @param {string} userId - User ID
 * @param {number} step - Current onboarding step
 * @returns {Promise<User>} Updated user
 */
exports.updateOnboardingStep = async (userId, step) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { onboardingStep: step },
    { new: true }
  );

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Update user preference
 * @param {string} userId - User ID
 * @param {string} key - Preference key
 * @param {any} value - Preference value
 * @returns {Promise<User>} Updated user
 */
exports.updateUserPreference = async (userId, key, value) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Initialize preferences if not exists
  if (!user.preferences) {
    user.preferences = {};
  }

  // Update preference
  user.preferences[key] = value;
  await user.save();

  return user;
}; 