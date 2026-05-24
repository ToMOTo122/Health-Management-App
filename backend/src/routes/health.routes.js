const { Router } = require('express');
const { makeRecordController, VALID_TYPES } = require('../controllers/record.controller');
const { auth } = require('../middleware/auth');

const router = Router();

// Dynamically mount CRUD routes for each record type
for (const type of VALID_TYPES) {
  const ctrl = makeRecordController(type);

  router.post(`/${type}`, auth, ctrl.create);
  router.get(`/${type}`, auth, ctrl.query);
  router.get(`/${type}/:id`, auth, ctrl.getById);
  router.put(`/${type}/:id`, auth, ctrl.update);
  router.delete(`/${type}/:id`, auth, ctrl.delete);
}

module.exports = router;
