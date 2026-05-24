const { Router } = require('express');
const remindersController = require('../controllers/reminders.controller');
const { auth } = require('../middleware/auth');

const router = Router();

router.get('/', auth, remindersController.list);
router.post('/', auth, remindersController.create);
router.put('/:id', auth, remindersController.update);
router.delete('/:id', auth, remindersController.remove);
router.get('/due', auth, remindersController.due);

module.exports = router;
