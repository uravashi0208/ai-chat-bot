const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { formatResponse } = require('./utils/response');

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173", 
    "http://localhost:5174", 
    "http://localhost:8100", // Ionic dev server port
    "http://localhost:4200",
    process.env.CLIENT_URL,
    process.env.CLIENT_URL_2
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Enhanced rate limiting with different limits for different routes
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: message,
      timestamp: new Date().toISOString()
    });
  }
});

// General rate limit
app.use(createRateLimit(15 * 60 * 1000, 100, 'Too many requests, please try again later'));

// Stricter rate limit for auth endpoints
app.use('/api/auth', createRateLimit(15 * 60 * 1000, 20, 'Too many authentication attempts, please try again later'));

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Response formatting middleware
app.use(formatResponse);

// Request logging and monitoring
app.use((req, res, next) => {
  const startTime = Date.now();
  
  logger.info({
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });

  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// Enhanced health check
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };
  
  res.status(200).json(healthcheck);
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Chat App API v1.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/logout': 'Logout user',
        'POST /api/auth/refresh-token': 'Refresh access token'
      },
      users: {
        'GET /api/users/me': 'Get current user profile',
        'GET /api/users': 'Get all users (authenticated)',
        'GET /api/users/with-messages': 'Get users with last messages',
        'GET /api/users/:id': 'Get user by ID'
      },
      chat: {
        'GET /api/chat/messages/:userId': 'Get conversation with user',
        'POST /api/chat/messages/:userId': 'Send message to user',
        'PATCH /api/chat/messages/:messageId/read': 'Mark message as read',
        'GET /api/chat/unread-count/:fromUserId': 'Get unread message count'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(errorHandler);

module.exports = app;