// Load environment variables FIRST
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

// Initialize logger early
const logger = require('./utils/logger');

// Log environment check
logger.info('🚀 Starting server...', {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT || 5000,
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_KEY
});

const app = require('./app');
const { setupSocket } = require('./services/socketService');

const PORT = process.env.PORT || 5000;

try {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8100", // Ionic dev server port
        "http://localhost:4200",
        process.env.CLIENT_URL,
        process.env.CLIENT_URL_2
      ].filter(Boolean), // Remove any undefined values
      methods: ["GET", "POST"],
      credentials: true
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true
    }
  });

  // Initialize Socket.io
  logger.info('🔌 Initializing Socket.IO...');
  setupSocket(io);

  // Start server
  server.listen(PORT, () => {
    logger.info(`✅ Server running successfully on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
    console.log(`🚀 Server running on port ${PORT}`);
  });

  // Handle server errors
  server.on('error', (error) => {
    logger.error('❌ Server error:', error);
    console.error('Server error:', error);
    process.exit(1);
  });

} catch (error) {
  logger.error('❌ Failed to start server:', error);
  console.error('Failed to start server:', error);
  process.exit(1);
}