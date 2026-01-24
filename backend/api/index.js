// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const config = require('../src/config/config');
const { generalLimiter } = require('../src/middleware/rateLimiter');

// Import routes
const authRoutes = require('../src/routes/authRoutes');
const userRoutes = require('../src/routes/userRoutes');
const cyclistProfileRoutes = require('../src/routes/cyclistProfileRoutes');
const rideMatchRoutes = require('../src/routes/rideMatchRoutes');
const messageRoutes = require('../src/routes/messageRoutes');

// Initialize Express app
const app = express();

// ======================
// Middleware
// ======================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Rate limiting
app.use('/api/', generalLimiter);

// ======================
// Routes
// ======================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv || 'production',
  });
});

// API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/cyclist-profile', cyclistProfileRoutes);
app.use('/api/v1/ridematch', rideMatchRoutes);
app.use('/api/v1/matches', messageRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'TerraGravel API',
    version: '1.0.0',
    description: 'Cyclist matching platform backend',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      cyclistProfile: '/api/v1/cyclist-profile',
      rideMatch: '/api/v1/ridematch',
      messages: '/api/v1/matches/:matchId/messages',
    },
  });
});

// ======================
// Error Handling
// ======================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.message,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      message: err.message,
      stack: err.stack
    }),
  });
});

// Export for Vercel serverless
module.exports = app;
