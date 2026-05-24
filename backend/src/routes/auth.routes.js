const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { auth, authStrict } = require('../middleware/auth');
const validate = require('../middleware/validate');
const authValidation = require('../utils/validators');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post('/register', authLimiter, authValidation.register, validate, authController.register);
router.post('/login', authLimiter, authValidation.login, validate, authController.login);
router.post('/refresh', authController.refresh);
router.get('/me', auth, authController.me);
router.post('/logout', authStrict, authController.logout);

module.exports = router;
