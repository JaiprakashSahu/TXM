const { Router } = require('express');
const bookingController = require('../controllers/booking.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/roleGuard.middleware');
const asyncWrapper = require('../utils/asyncWrapper');

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// ── Static paths first (before /:id) ────────────────────────────────────────

// Browse available flights
router.get(
  '/options/flights',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => bookingController.getFlightOptions(req, res))
);

// Browse available hotels
router.get(
  '/options/hotels',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => bookingController.getHotelOptions(req, res))
);

// List my bookings
router.get(
  '/my',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => bookingController.listMy(req, res))
);

// ── Create booking (idempotency key required) ────────────────────────────────

router.post(
  '/',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => bookingController.create(req, res))
);

// ── Parameterized routes ─────────────────────────────────────────────────────

// Get single booking
router.get(
  '/:id',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => bookingController.getById(req, res))
);

// Cancel booking
router.post(
  '/:id/cancel',
  authorize('employee', 'manager', 'admin'),
  asyncWrapper((req, res) => bookingController.cancel(req, res))
);

module.exports = router;
