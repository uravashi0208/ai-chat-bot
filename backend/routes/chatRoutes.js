const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticate = require('../middleware/auth');

router.get('/messages/:userId', authenticate, chatController.getMessages);
router.post('/messages/:userId', authenticate, chatController.sendMessage);
router.patch('/messages/:messageId/read', authenticate, chatController.markAsRead);

module.exports = router;