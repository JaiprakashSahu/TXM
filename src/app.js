const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes');
const requestLogger = require('./middlewares/requestLogger.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const { registerHandlers } = require('./events/eventHandlers');

const app = express();

// Register domain event handlers (fire-and-forget side effects)
registerHandlers();

// Security headers
app.use(helmet());

// CORS
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// Static file serving for uploaded receipts
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

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
