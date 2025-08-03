const Message = require('../models/Message');
const { verifyAccessToken } = require('../config/jwt');
const logger = require('../utils/logger');

const onlineUsers = new Map();

const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        logger.error('No token provided');
        return next(new Error('Authentication error'));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      logger.info(`User authenticated: ${decoded.username}`);
      next();
    } catch (error) {
      logger.error(`Socket auth error: ${error.message}`);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`New connection: ${socket.id}`);
    const { userId, username } = socket;
    
    // Add user to online list
    onlineUsers.set(userId, socket.id);
    logger.info(`User connected: ${username} (${userId})`);

    // Debugging
    socket.onAny((event, ...args) => {
      logger.debug(`Socket event: ${event}`, args);
    });

    // Handle private messages
    socket.on('send_message', async ({ receiverId, content, tempId }, callback) => {
      try {
        logger.info(`Message attempt from ${userId} to ${receiverId}`);
        
        if (!content || !receiverId) {
          throw new Error('Content and receiverId are required');
        }

        // Save to database
        logger.info('Saving message to database...');
        const message = await Message.create({
          sender_id: userId,
          receiver_id: receiverId,
          content
        });
        logger.info('Message saved:', message);

        // Prepare response
        const messageData = {
          id: message.id,
          senderId: userId,
          senderUsername: username,
          receiverId,
          content,
          sentAt: message.sent_at,
          tempId
        };

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          logger.info(`Sending to receiver socket: ${receiverSocketId}`);
          io.to(receiverSocketId).emit('receive_message', messageData);
        }

        // Confirm to sender
        callback({ 
          success: true, 
          message: messageData 
        });

      } catch (error) {
        logger.error(`Message processing failed: ${error.message}`);
        callback({ 
          success: false, 
          error: error.message,
          tempId 
        });
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      logger.info(`User disconnected: ${username} (${userId})`);
    });
  });
};

module.exports = { setupSocket, onlineUsers };