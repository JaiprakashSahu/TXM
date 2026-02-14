const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userRepository = require('../repositories/user.repository');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("AUTH HEADER:", authHeader); // Debug log

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    const user = await userRepository.findActiveById(decoded.sub);
    if (!user) {
      return next(new UnauthorizedError('User not found or inactive'));
    }
    req.user = user;

    // Optional: Block access if password change is required
    // Allow /change-password route to proceed
    if (user.mustChangePassword && !req.originalUrl.endsWith('/change-password')) {
      return next(new ForbiddenError('Password change required'));
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Access token expired'));
    }
    return next(new UnauthorizedError('Invalid access token'));
  }
};

module.exports = authenticate;
