const { Router } = require('express');
const authRoutes = require('./auth.routes');
const testRoutes = require('./test.routes');
const travelRoutes = require('./travel.routes');
const expenseRoutes = require('./expense.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/test', testRoutes);
router.use('/travel', travelRoutes);
router.use('/expenses', expenseRoutes);

module.exports = router;
