const { Router } = require('express');
const travelController = require('../controllers/travel.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/roleGuard.middleware');
const asyncWrapper = require('../utils/asyncWrapper');

const router = Router();

// All travel routes require authentication
router.use(authenticate);

// ── Static GET routes (must be registered before /:id) ───────────────────────

// List my travel requests (paginated)
router.get(
  '/my',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => travelController.listMy(req, res))
);

// List submitted requests assigned to this manager
router.get(
  '/manager/pending',
  authorize('manager', 'admin'),
  asyncWrapper((req, res) => travelController.listPendingForManager(req, res))
);

// ── Employee routes ──────────────────────────────────────────────────────────

// Create a draft travel request
router.post(
  '/',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => travelController.create(req, res))
);

// Get a single travel request by ID
router.get(
  '/:id',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => travelController.getById(req, res))
);

// Update a draft travel request (owner only — enforced in service)
router.put(
  '/:id',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => travelController.update(req, res))
);

// Submit a draft for approval
router.post(
  '/:id/submit',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => travelController.submit(req, res))
);

// Cancel a travel request (owner or assigned manager — enforced in service)
router.post(
  '/:id/cancel',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => travelController.cancel(req, res))
);

// ── Manager action routes ────────────────────────────────────────────────────

// Approve a submitted request
router.post(
  '/:id/approve',
  authorize('manager', 'admin'),
  asyncWrapper((req, res) => travelController.approve(req, res))
);

// Reject a submitted request
router.post(
  '/:id/reject',
  authorize('manager', 'admin'),
  asyncWrapper((req, res) => travelController.reject(req, res))
);

module.exports = router;
