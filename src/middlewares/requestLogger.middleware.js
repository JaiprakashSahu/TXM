const logger = require('../utils/logger');

const requestLogger = (req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl} [${req.ip}]`);
  next();
};

module.exports = requestLogger;
