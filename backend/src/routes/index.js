const { Router } = require('express');

const router = Router();

router.get('/status', (_req, res) => res.json({ status: 'running' }));

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/health', require('./health.routes'));
router.use('/analysis', require('./analysis.routes'));
router.use('/reminders', require('./reminders.routes'));
router.use('/chat', require('./chat.routes'));
router.use('/export', require('./export.routes'));

module.exports = router;
