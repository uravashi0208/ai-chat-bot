const Message = require('../models/Message');

exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Message.getConversation(
      req.user.userId,
      req.params.userId
    );
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const { userId } = req.params;

    const message = await Message.create({
      sender_id: req.user.userId,
      receiver_id: userId,
      content
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    await Message.markAsRead(req.params.messageId, req.user.userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};