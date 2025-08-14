const winston = require('winston');
const path = require('path');

// Custom format for console output in development
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if it exists
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return msg;
  })
);

// Production format for file logging
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports = [
  // Error logs
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: prodFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Combined logs
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    format: prodFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
];

// Add console transport based on environment
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: devFormat
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: prodFormat,
      level: 'warn' // Only warn and error in production console
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/exceptions.log'),
      format: prodFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/rejections.log'),
      format: prodFormat
    })
  ]
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Add helper methods for structured logging
logger.logRequest = (req, res, duration) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || null,
    statusCode: res.statusCode,
    duration: `${duration}ms`
  });
};

logger.logError = (error, req = null) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name
  };
  
  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.userId || null
    };
  }
  
  logger.error('Application Error', errorInfo);
};

module.exports = logger;