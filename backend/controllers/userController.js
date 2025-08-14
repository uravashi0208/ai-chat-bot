const User = require('../models/User');
const Message = require('../models/Message');
const logger = require('../utils/logger');

exports.getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    logger.info(`📋 Getting current user: ${userId}`);
    
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      return next(error);
    }
    
    // Update last seen when user accesses their profile
    await User.updateLastSeen(userId);
    
    logger.info(`✅ Current user retrieved: ${user.username}`);
    res.json(user);
  } catch (error) {
    logger.error(`❌ Error getting current user: ${error.message}`);
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;
    logger.info(`📋 Getting all users except: ${currentUserId}`);
    
    const users = await User.findAllExcept(currentUserId);
    
    logger.info(`✅ Retrieved ${users.length} users`);
    res.json(users);
  } catch (error) {
    logger.error(`❌ Error getting users: ${error.message}`);
    next(error);
  }
};

exports.getUsersWithLastMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;
    logger.info(`📋 Getting users with last messages for: ${currentUserId}`);
    
    // Get all users except current user
    const users = await User.findAllExcept(currentUserId);
    
    if (!users.length) {
      logger.info('ℹ️ No other users found');
      return res.json([]);
    }
    
    // Get last messages and unread counts for each user
    const usersWithMessages = await Promise.all(
      users.map(async (user) => {
        try {
          // Get the last message using the enhanced Message model
          const lastMessage = await Message.getLastMessage(currentUserId, user.id);
          
          // Get unread messages count
          const unreadCount = await Message.getUnreadCount(currentUserId, user.id);

          return {
            ...user,
            lastMessage: lastMessage || null,
            unreadCount: unreadCount || 0
          };
        } catch (userError) {
          logger.error(`Error processing user ${user.id}: ${userError.message}`);
          return {
            ...user,
            lastMessage: null,
            unreadCount: 0
          };
        }
      })
    );

    // Sort by last message time (most recent first)
    usersWithMessages.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.sent_at) - new Date(a.lastMessage.sent_at);
    });

    logger.info(`✅ Retrieved ${usersWithMessages.length} users with message data`);
    res.json(usersWithMessages);
  } catch (error) {
    logger.error(`❌ Error getting users with messages: ${error.message}`);
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const requestingUserId = req.user.userId;
    
    logger.info(`📋 Getting user by ID: ${userId} (requested by ${requestingUserId})`);
    
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      return next(error);
    }
    
    logger.info(`✅ User retrieved: ${user.username}`);
    res.json(user);
  } catch (error) {
    logger.error(`❌ Error getting user by ID: ${error.message}`);
    next(error);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { online } = req.body;
    
    logger.info(`🔄 Updating user status: ${userId} -> ${online ? 'online' : 'offline'}`);
    
    const updatedUser = await User.updateOnlineStatus(userId, online);
    
    // Also update last seen when going online
    if (online) {
      await User.updateLastSeen(userId);
    }
    
    logger.info(`✅ User status updated: ${userId}`);
    res.json(updatedUser);
  } catch (error) {
    logger.error(`❌ Error updating user status: ${error.message}`);
    next(error);
  }
};