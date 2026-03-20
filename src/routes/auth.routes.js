const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth.middleware');
const { authLimiter, sensitiveOpLimiter } = require('../middlewares/rateLimiter.middleware');
const asyncWrapper = require('../utils/asyncWrapper');

const router = Router();

// SECURITY: Rate limit authentication endpoints to prevent brute force
router.post('/register', authLimiter, asyncWrapper((req, res) => authController.register(req, res)));
router.post('/login', authLimiter, asyncWrapper((req, res) => authController.login(req, res)));
router.post('/refresh', sensitiveOpLimiter, asyncWrapper((req, res) => authController.refresh(req, res)));
router.post('/logout', asyncWrapper((req, res) => authController.logout(req, res)));

// Protected routes
router.get('/profile', authenticate, asyncWrapper((req, res) => authController.profile(req, res)));
router.get('/managers', authenticate, asyncWrapper((req, res) => authController.listManagers(req, res)));
router.post('/change-password', authenticate, sensitiveOpLimiter, asyncWrapper((req, res) => authController.changePassword(req, res)));

module.exports = router;
