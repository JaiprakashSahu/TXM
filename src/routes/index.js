const { Router } = require('express');
const authRoutes = require('./auth.routes');
const testRoutes = require('./test.routes');
const travelRoutes = require('./travel.routes');
const expenseRoutes = require('./expense.routes');
const policyRoutes = require('./policy.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/test', testRoutes);
router.use('/travel', travelRoutes);
router.use('/expenses', expenseRoutes);
router.use('/policy', policyRoutes);

module.exports = router;
