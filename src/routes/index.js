const { Router } = require('express');
const authRoutes = require('./auth.routes');
const testRoutes = require('./test.routes');
const travelRoutes = require('./travel.routes');
const expenseRoutes = require('./expense.routes');
const policyRoutes = require('./policy.routes');
const bookingRoutes = require('./booking.routes');
const analyticsRoutes = require('./analytics.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/test', testRoutes);
router.use('/travel', travelRoutes);
router.use('/expenses', expenseRoutes);
router.use('/policy', policyRoutes);
router.use('/booking', bookingRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
