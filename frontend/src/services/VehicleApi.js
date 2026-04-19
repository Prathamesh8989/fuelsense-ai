import axios from 'axios';

const API = 'http://localhost:5000/api/vehicles';

// GET ALL VEHICLES
export const getVehicles = async () => {
  return await axios.get(API);
};

// CREATE VEHICLE
export const createVehicle = async (data) => {
  return await axios.post(API, data);
};

// DELETE VEHICLE
export const deleteVehicle = async (id) => {
  return await axios.delete(`${API}/${id}`);
};