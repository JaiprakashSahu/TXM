const info = (message, ...args) => {
  console.log(`[${new Date().toISOString()}] INFO: ${message}`, ...args);
};

const warn = (message, ...args) => {
  console.warn(`[${new Date().toISOString()}] WARN: ${message}`, ...args);
};

const error = (message, ...args) => {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...args);
};

const debug = (message, ...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, ...args);
  }
};

module.exports = { info, warn, error, debug };
