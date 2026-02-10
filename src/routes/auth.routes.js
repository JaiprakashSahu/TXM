const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth.middleware');
const asyncWrapper = require('../utils/asyncWrapper');

const router = Router();

router.post('/register', asyncWrapper((req, res) => authController.register(req, res)));
router.post('/login', asyncWrapper((req, res) => authController.login(req, res)));
router.post('/refresh', asyncWrapper((req, res) => authController.refresh(req, res)));
router.post('/logout', asyncWrapper((req, res) => authController.logout(req, res)));

// Protected routes
router.get('/profile', authenticate, asyncWrapper((req, res) => authController.profile(req, res)));
router.get('/managers', authenticate, asyncWrapper((req, res) => authController.listManagers(req, res)));

module.exports = router;
