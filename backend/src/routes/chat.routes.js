const { Router } = require('express');
const chatController = require('../controllers/chat.controller');
const { auth } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post('/message', auth, chatLimiter, chatController.sendMessage);
router.get('/history', auth, chatController.getHistory);

module.exports = router;
