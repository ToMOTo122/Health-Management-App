require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
app.use('/api', generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Error handling
app.use(errorHandler);

module.exports = app;
