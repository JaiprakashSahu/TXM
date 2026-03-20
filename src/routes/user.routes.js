const { Router } = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/roleGuard.middleware');
const { passwordResetLimiter, sensitiveOpLimiter } = require('../middlewares/rateLimiter.middleware');
const asyncWrapper = require('../utils/asyncWrapper');

const router = Router();

// Only admin can create users
router.post(
    '/',
    authenticate,
    authorize('admin'),
    sensitiveOpLimiter,
    asyncWrapper((req, res) => userController.createUser(req, res))
);

router.get(
    '/',
    authenticate,
    authorize('admin'),
    asyncWrapper((req, res) => userController.getUsers(req, res))
);

router.get(
    '/:id',
    authenticate,
    authorize('admin'),
    asyncWrapper((req, res) => userController.getUser(req, res))
);

router.patch(
    '/:id/role',
    authenticate,
    authorize('admin'),
    sensitiveOpLimiter,
    asyncWrapper((req, res) => userController.updateRole(req, res))
);

router.patch(
    '/:id/deactivate',
    authenticate,
    authorize('admin'),
    sensitiveOpLimiter,
    asyncWrapper((req, res) => userController.deactivateUser(req, res))
);

// SECURITY: Strict rate limit on password reset
router.post(
    '/:id/reset-password',
    authenticate,
    authorize('admin'),
    passwordResetLimiter,
    asyncWrapper((req, res) => userController.resetPassword(req, res))
);

module.exports = router;
