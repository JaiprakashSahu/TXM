const { Router } = require('express');
const notificationController = require('../controllers/notification.controller');
const authenticate = require('../middlewares/auth.middleware');
const asyncWrapper = require('../utils/asyncWrapper');

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get(
  '/my',
  asyncWrapper((req, res) => notificationController.listMy(req, res))
);

module.exports = router;
