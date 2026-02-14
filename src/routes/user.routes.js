const { Router } = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/roleGuard.middleware');
const asyncWrapper = require('../utils/asyncWrapper');

const router = Router();

// Only admin can create users
router.post(
    '/',
    authenticate,
    authorize('admin'),
    asyncWrapper((req, res) => userController.createUser(req, res))
);

router.get(
    '/',
    authenticate,
    authorize('admin'),
    asyncWrapper((req, res) => userController.getUsers(req, res))
);

module.exports = router;
