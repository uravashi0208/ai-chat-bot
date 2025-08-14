// Standardized API Response Utility
const logger = require('./logger');

class ApiResponse {
  static success(data, message = 'Success', statusCode = 200) {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(message = 'An error occurred', statusCode = 500, errors = null) {
    return {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  static paginated(data, pagination, message = 'Success') {
    return {
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString()
    };
  }
}

// Response middleware for consistent formatting
const formatResponse = (req, res, next) => {
  // Skip formatting for main API endpoints to maintain backward compatibility
  if (req.path.startsWith('/api/auth') || 
      req.path.startsWith('/api/users') || 
      req.path.startsWith('/api/chat')) {
    return next();
  }
  
  const originalJson = res.json;
  
  res.json = function(data) {
    // If data is already formatted (has success property), send as-is
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, data);
    }
    
    // Auto-format successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return originalJson.call(this, ApiResponse.success(data));
    }
    
    // Keep error responses as-is for now (handled by error handler)
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = { ApiResponse, formatResponse };