const Joi = require('joi');
const { ApiResponse } = require('./response');

// Enhanced validation schemas
const schemas = {
  register: Joi.object({
    username: Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters'
      }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .pattern(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.pattern.base': 'Password must contain at least one letter and one number'
      })
  }),

  login: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    password: Joi.string().required()
  }),

  message: Joi.object({
    content: Joi.string()
      .min(1)
      .max(1000)
      .trim()
      .required()
      .messages({
        'string.empty': 'Message content cannot be empty',
        'string.max': 'Message cannot exceed 1000 characters'
      })
  }),

  userId: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'Invalid user ID format - must be a valid UUID'
    })
};

// Legacy schemas for backward compatibility
const registerSchema = schemas.register;
const loginSchema = schemas.login;

// Generic validator function
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false, // Return all validation errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return next(validationError);
    }

    next();
  };
};

// Parameter validator for URL parameters
const validateParam = (paramName, schema) => {
  return (req, res, next) => {
    const paramValue = req.params[paramName];
    
    const { error } = schema.validate(paramValue);
    
    if (error) {
      const validationError = new Error(`Invalid ${paramName} parameter`);
      validationError.name = 'ValidationError';
      validationError.details = [{
        field: paramName,
        message: error.details[0].message
      }];
      return next(validationError);
    }
    
    next();
  };
};

// Legacy validators - maintain backward compatibility
const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// New enhanced validators
const validateMessage = validate(schemas.message);
const validateUserIdParam = validateParam('userId', schemas.userId);

module.exports = { 
  // Legacy exports for backward compatibility
  validateRegister, 
  validateLogin,
  registerSchema,
  loginSchema,
  
  // New enhanced exports
  validateMessage, 
  validateUserIdParam,
  validate,
  validateParam,
  schemas
};