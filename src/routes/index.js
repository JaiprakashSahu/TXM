const { Router } = require('express');
const authRoutes = require('./auth.routes');
const testRoutes = require('./test.routes');
const travelRoutes = require('./travel.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/test', testRoutes);
router.use('/travel', travelRoutes);

module.exports = router;
