const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticate = require('../middleware/auth');
const { validateMessage, validateParam, schemas } = require('../utils/validators');

// Create specific parameter validators
const validateUserId = validateParam('userId', schemas.userId);
const validateFromUserId = validateParam('fromUserId', schemas.userId);

// Existing routes - maintain backward compatibility
router.get('/messages/:userId', authenticate, validateUserId, chatController.getMessages);
router.post('/messages/:userId', authenticate, validateUserId, validateMessage, chatController.sendMessage);
router.patch('/messages/:messageId/read', authenticate, chatController.markAsRead);

// New enhanced routes
router.get('/unread-count/:fromUserId', authenticate, validateFromUserId, chatController.getUnreadCount);

module.exports = router;