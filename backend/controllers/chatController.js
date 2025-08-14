const Message = require('../models/Message');
const { ApiResponse } = require('../utils/response');
const logger = require('../utils/logger');

exports.getMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;
    const targetUserId = req.params.userId;
    
    logger.info(`📥 Getting messages between users ${currentUserId} and ${targetUserId}`);
    
    // Validate that target user exists
    const User = require('../models/User');
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      const error = new Error('Target user not found');
      error.statusCode = 404;
      return next(error);
    }
    
    const messages = await Message.getConversation(currentUserId, targetUserId);
    
    logger.info(`✅ Retrieved ${messages.length} messages for conversation`);
    
    // Return raw data for backward compatibility
    res.json(messages);
  } catch (error) {
    logger.error(`❌ Error getting messages: ${error.message}`);
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const { userId: receiverId } = req.params;
    const senderId = req.user.userId;

    logger.info(`📤 Sending message from ${senderId} to ${receiverId}`);
    
    // Validate receiver exists
    const User = require('../models/User');
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      const error = new Error('Receiver not found');
      error.statusCode = 404;
      return next(error);
    }

    // Prevent self-messaging
    if (senderId === receiverId) {
      const error = new Error('Cannot send message to yourself');
      error.statusCode = 400;
      return next(error);
    }

    const message = await Message.create({
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim()
    });

    logger.info(`✅ Message created with ID: ${message.id}`);

    // Return raw data for backward compatibility
    res.status(201).json(message);
  } catch (error) {
    logger.error(`❌ Error sending message: ${error.message}`);
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    
    logger.info(`📖 Marking message ${messageId} as read by user ${userId}`);
    
    await Message.markAsRead(messageId, userId);
    
    logger.info(`✅ Message ${messageId} marked as read`);
    
    res.status(204).end();
  } catch (error) {
    logger.error(`❌ Error marking message as read: ${error.message}`);
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { fromUserId } = req.params;
    
    const unreadCount = await Message.getUnreadCount(userId, fromUserId);
    
    res.json({ unreadCount });
  } catch (error) {
    logger.error(`❌ Error getting unread count: ${error.message}`);
    next(error);
  }
};