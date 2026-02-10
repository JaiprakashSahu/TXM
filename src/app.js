const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes');
const requestLogger = require('./middlewares/requestLogger.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
