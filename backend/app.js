const express = require('express');
const cors = require('cors');
require('dotenv').config();

const tripRoutes = require('./routes/tripRoutes');
const routeRoutes = require('./routes/routeRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// Routes
// Note: Ensure tripRoutes.js and routeRoutes.js internal paths 
// start from the resource name (e.g., router.post('/predict', ...))
app.use('/api/trips', tripRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/vehicles', require('./routes/vehicleRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'FuelSense AI Backend', 
    timestamp: new Date() 
  });
});

// Global Error Handler - This helps you see why a 400 error is happening
app.use((err, req, res, next) => {
  console.error('❌ Backend Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;