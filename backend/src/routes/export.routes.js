const { Router } = require('express');
const exportController = require('../controllers/export.controller');
const { auth } = require('../middleware/auth');

const router = Router();

router.get('/json', auth, exportController.exportJSON);
router.get('/csv/:type', auth, exportController.exportCSV);

module.exports = router;
