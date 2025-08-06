require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { setupSocket } = require('./services/socketService');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174", 
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
setupSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});