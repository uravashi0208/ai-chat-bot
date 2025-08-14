const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const { validateParam, schemas } = require('../utils/validators');

// Create specific parameter validator
const validateId = validateParam('id', schemas.userId);

// Existing routes - maintain backward compatibility
router.get('/me', authenticate, userController.getCurrentUser);
router.get('/', authenticate, userController.getAllUsers);
router.get('/with-messages', authenticate, userController.getUsersWithLastMessages);
router.get('/:id', authenticate, validateId, userController.getUserById);

// New routes
router.patch('/status', authenticate, userController.updateUserStatus);

module.exports = router;