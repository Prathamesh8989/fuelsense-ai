import Vehicle from '../models/Vehicle.js';
import mongoose from 'mongoose';

// GET /api/vehicles
const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json({ success: true, vehicles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/vehicles
const createVehicle = async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json({ success: true, vehicle });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE /api/vehicles/:id
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Vehicle.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { getVehicles, createVehicle, deleteVehicle };
