const { Router } = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/roleGuard.middleware');
const asyncWrapper = require('../utils/asyncWrapper');

const router = Router();

// All analytics routes require authentication + admin role
router.use(authenticate);

router.get(
  '/summary',
  authorize('admin'),
  asyncWrapper((req, res) => analyticsController.getSummary(req, res))
);

router.get(
  '/monthly-trend',
  authorize('admin'),
  asyncWrapper((req, res) => analyticsController.getMonthlyTrend(req, res))
);

router.get(
  '/top-spenders',
  authorize('admin'),
  asyncWrapper((req, res) => analyticsController.getTopSpenders(req, res))
);

router.get(
  '/violations',
  authorize('admin'),
  asyncWrapper((req, res) => analyticsController.getViolations(req, res))
);

router.get(
  '/manager-performance',
  authorize('admin'),
  asyncWrapper((req, res) => analyticsController.getManagerPerformance(req, res))
);

module.exports = router;
