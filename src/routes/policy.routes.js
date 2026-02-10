const { Router } = require('express');
const policyController = require('../controllers/policy.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/roleGuard.middleware');
const asyncWrapper = require('../utils/asyncWrapper');

const router = Router();

// All policy routes require authentication + admin role
router.use(authenticate);

// ── Static paths first ───────────────────────────────────────────────────────

// Get the currently active policy
router.get(
  '/active',
  authorize('admin'),
  asyncWrapper((req, res) => policyController.getActive(req, res))
);

// List all policies (paginated, newest version first)
router.get(
  '/all',
  authorize('admin'),
  asyncWrapper((req, res) => policyController.listAll(req, res))
);

// Create a new policy draft
router.post(
  '/',
  authorize('admin'),
  asyncWrapper((req, res) => policyController.create(req, res))
);

// ── Parameterized routes ─────────────────────────────────────────────────────

// Get single policy by ID
router.get(
  '/:id',
  authorize('admin'),
  asyncWrapper((req, res) => policyController.getById(req, res))
);

// Activate a policy
router.post(
  '/:id/activate',
  authorize('admin'),
  asyncWrapper((req, res) => policyController.activate(req, res))
);

module.exports = router;
