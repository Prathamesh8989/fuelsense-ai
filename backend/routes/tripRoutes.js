const express = require('express');
const router = express.Router();
const { 
  predictTrip, 
  saveTrip, 
  getTrips, 
  getTripStats,
  deleteTrip 
} = require('../controllers/tripController');

// Actual URL: POST /api/trips/predict
router.post('/predict', predictTrip);

// Actual URL: POST /api/trips
// Changed from '/trip' to '/' to match api.js saveTrip call
router.post('/', saveTrip);

// Actual URL: GET /api/trips
// Changed from '/trips' to '/' to match api.js getTrips call
router.get('/', getTrips);

// Actual URL: GET /api/trips/stats
// Changed from '/trips/stats' to '/stats'
router.get('/stats', getTripStats);

router.delete('/:id', deleteTrip);

module.exports = router;
