const express = require('express');
const router = express.Router();
const { geocodeAddress, getOptimizedRoute } = require('../controllers/routeController.js');

router.post('/geocode', geocodeAddress);
router.post('/routes', getOptimizedRoute);

module.exports = router;

