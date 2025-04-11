/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = new Error(messages.join(', '));
    return res.status(400).json({
      success: false,
      error: error.message || 'Validation Error'
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`);
    return res.status(400).json({
      success: false,
      error: error.message || 'Duplicate Field Value Entered'
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new Error(`Resource not found with id of ${err.value}`);
    return res.status(404).json({
      success: false,
      error: error.message || 'Resource not found'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  // Default response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler; 