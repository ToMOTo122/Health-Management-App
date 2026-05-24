const { Router } = require('express');
const analysisController = require('../controllers/analysis.controller');
const { auth } = require('../middleware/auth');

const router = Router();

router.get('/today', auth, analysisController.today);
router.get('/summary', auth, analysisController.summary);
router.get('/trend/:type', auth, analysisController.trend);
router.get('/goal-status', auth, analysisController.goalStatus);
router.get('/weekly-report', auth, analysisController.weeklyReport);

module.exports = router;
