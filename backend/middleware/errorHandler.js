const logger = require('../utils/logger');
const { ApiResponse } = require('../utils/response');

module.exports = (err, req, res, next) => {
  // Log error with context
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.userId || 'anonymous',
    ip: req.ip
  });

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.details;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.code === '23505') { // PostgreSQL unique constraint violation
    statusCode = 409;
    message = 'Duplicate entry';
  } else if (err.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Invalid reference';
  }

  // For main API endpoints, maintain backward compatibility with simple error format
  if (req.path.startsWith('/api/auth') || 
      req.path.startsWith('/api/users') || 
      req.path.startsWith('/api/chat')) {
    return res.status(statusCode).json({ error: message });
  }

  // Create consistent error response for other endpoints
  const response = ApiResponse.error(message, statusCode, errors);
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};