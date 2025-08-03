require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { setupSocket } = require('./services/socketService');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
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