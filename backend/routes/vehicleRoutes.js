const express = require('express');
const router = express.Router();

const { getVehicles, createVehicle, deleteVehicle } = require('../controllers/vehicleController');

// GET /api/vehicles
router.get('/', getVehicles);

// POST /api/vehicles
router.post('/', createVehicle);

// DELETE /api/vehicles/:id
router.delete('/:id', deleteVehicle);

module.exports = router;
