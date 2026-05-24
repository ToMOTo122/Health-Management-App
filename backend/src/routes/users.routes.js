const { Router } = require('express');
const usersController = require('../controllers/users.controller');
const { auth } = require('../middleware/auth');

const router = Router();

router.get('/profile', auth, usersController.getProfile);
router.put('/profile', auth, usersController.updateProfile);
router.put('/password', auth, usersController.changePassword);
router.get('/goals', auth, usersController.getGoals);
router.put('/goals', auth, usersController.updateGoals);

module.exports = router;
