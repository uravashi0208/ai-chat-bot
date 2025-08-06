const Message = require('../models/Message');
const { verifyAccessToken } = require('../config/jwt');
const logger = require('../utils/logger');

const onlineUsers = new Map();

const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        logger.error('❌ No token provided');
        return next(new Error('Authentication error'));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = parseInt(decoded.userId); // Ensure userId is a number
      socket.username = decoded.username;
      logger.info(`✅ User authenticated: ${decoded.username} (ID: ${socket.userId})`);
      next();
    } catch (error) {
      logger.error(`❌ Socket auth error: ${error.message}`);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 New connection: ${socket.id}`);
    const { userId, username } = socket;
    
    // Add user to online list - store both ways for easier lookup
    onlineUsers.set(userId, socket.id);
    onlineUsers.set(socket.id, userId);
    
    logger.info(`👤 User connected: ${username} (ID: ${userId})`);
    logger.info(`📊 Online users: ${Array.from(onlineUsers.keys()).filter(k => typeof k === 'number')}`);

    // Debugging - log all socket events
    socket.onAny((event, ...args) => {
      logger.info(`🔔 Socket event from ${username}: ${event}`, args);
    });

    // Handle ping for connection testing
    socket.on('ping', (data, callback) => {
      logger.info(`🏓 Ping received from ${username}: ${data}`);
      if (callback) {
        callback('pong - connection working!');
      }
    });

    // Handle private messages
    socket.on('send_message', async ({ receiverId, content, tempId }, callback) => {
      try {
        const numericReceiverId = parseInt(receiverId);
        logger.info(`📤 Message attempt from ${username} (${userId}) to user ${numericReceiverId}`);
        logger.info(`📝 Message content: "${content}"`);
        
        if (!content || !receiverId) {
          throw new Error('Content and receiverId are required');
        }

        // Save to database
        logger.info('💾 Saving message to database...');
        const message = await Message.create({
          sender_id: userId,
          receiver_id: numericReceiverId,
          content
        });
        logger.info('✅ Message saved with ID:', message.id);

        // Prepare response - match frontend expected format
        const messageData = {
          id: message.id,
          sender_id: userId,
          receiver_id: numericReceiverId,
          content,
          sent_at: message.sent_at,
          read: false,
          tempId
        };

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(numericReceiverId);
        logger.info(`🔍 Looking for receiver ${numericReceiverId} in online users:`, Array.from(onlineUsers.keys()).filter(k => typeof k === 'number'));
        
        if (receiverSocketId) {
          logger.info(`📨 Sending message to receiver socket: ${receiverSocketId}`);
          io.to(receiverSocketId).emit('receive_message', messageData);
          logger.info('✅ Message sent to receiver');
        } else {
          logger.info(`⚠️ Receiver ${numericReceiverId} is not online`);
        }

        // Confirm to sender (don't send duplicate via socket emit)
        if (callback) {
          callback({ 
            success: true, 
            message: messageData 
          });
          logger.info('✅ Callback sent to sender');
        }

      } catch (error) {
        logger.error(`❌ Message processing failed: ${error.message}`, error.stack);
        if (callback) {
          callback({ 
            success: false, 
            error: error.message,
            tempId 
          });
        }
      }
    });

    socket.on('disconnect', () => {
      // Remove user from online list (both mappings)
      onlineUsers.delete(userId);
      onlineUsers.delete(socket.id);
      logger.info(`🔌 User disconnected: ${username} (${userId})`);
      logger.info(`📊 Remaining online users: ${Array.from(onlineUsers.keys()).filter(k => typeof k === 'number')}`);
    });
  });
};

module.exports = { setupSocket, onlineUsers };