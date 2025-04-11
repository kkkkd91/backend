const passport = require('passport');

/**
 * Middleware to protect routes using JWT strategy
 */
exports.protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, please log in',
      });
    }
    
    // Set user in request
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware to restrict access to verified users only
 * In testing mode, this will allow access regardless of verification status
 */
exports.restrictToVerified = (req, res, next) => {
  // Always allow access in testing mode
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      error: 'Please verify your email to access this resource',
    });
  }
  
  next();
};

/**
 * Middleware to check if onboarding is complete
 */
exports.checkOnboarding = (req, res, next) => {
  if (req.user.onboardingStatus !== 'completed') {
    return res.status(403).json({
      success: false,
      error: 'Please complete onboarding to access this resource',
    });
  }
  
  next();
}; 