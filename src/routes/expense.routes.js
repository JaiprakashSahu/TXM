const { Router } = require('express');
const expenseController = require('../controllers/expense.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/roleGuard.middleware');
const uploadReceipt = require('../middlewares/upload.middleware');
const asyncWrapper = require('../utils/asyncWrapper');

const router = Router();

// All expense routes require authentication
router.use(authenticate);

// ── Static paths first (before /:id param routes) ───────────────────────────

// List my expenses (paginated, filterable)
router.get(
  '/my',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => expenseController.listMy(req, res))
);

// List pending expenses for finance review (submitted + flagged)
router.get(
  '/pending',
  authorize('admin'),
  asyncWrapper((req, res) => expenseController.listPending(req, res))
);

// List flagged expenses only
router.get(
  '/flagged',
  authorize('admin'),
  asyncWrapper((req, res) => expenseController.listFlagged(req, res))
);

// ── Employee routes ──────────────────────────────────────────────────────────

// Submit an expense with optional receipt upload
router.post(
  '/',
  authorize('employee', 'manager', 'admin'),
  uploadReceipt.single('receipt'),
  asyncWrapper((req, res) => expenseController.submit(req, res))
);

// Get a single expense by ID
router.get(
  '/:id',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => expenseController.getById(req, res))
);

// ── Finance/Admin routes ─────────────────────────────────────────────────────

// Approve an expense
router.post(
  '/:id/approve',
  authorize('admin'),
  asyncWrapper((req, res) => expenseController.approve(req, res))
);

// Reject an expense
router.post(
  '/:id/reject',
  authorize('admin'),
  asyncWrapper((req, res) => expenseController.reject(req, res))
);

module.exports = router;
