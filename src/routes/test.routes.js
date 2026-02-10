const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/roleGuard.middleware');
const asyncWrapper = require('../utils/asyncWrapper');

const router = Router();

// Any authenticated user
router.get(
  '/protected',
  authenticate,
  asyncWrapper(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'You have access to the protected route',
      data: { user: req.user },
    });
  })
);

// Admin only
router.get(
  '/admin-only',
  authenticate,
  authorize('admin'),
  asyncWrapper(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Admin access granted',
      data: { user: req.user },
    });
  })
);

// Manager and admin
router.get(
  '/manager',
  authenticate,
  authorize('manager', 'admin'),
  asyncWrapper(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Manager access granted',
      data: { user: req.user },
    });
  })
);

module.exports = router;
