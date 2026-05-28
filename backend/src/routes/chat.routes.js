const { Router } = require('express');
const chatController = require('../controllers/chat.controller');
const { auth } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');

const router = Router();

// Conversation CRUD
router.get('/conversations', auth, chatController.listConversations);
router.post('/conversations', auth, chatController.createConversation);
router.patch('/conversations/:id', auth, chatController.updateConversation);
router.delete('/conversations/:id', auth, chatController.deleteConversation);

// Messaging
router.post('/message', auth, chatLimiter, chatController.sendMessage);
router.get('/history', auth, chatController.getHistory);

module.exports = router;
