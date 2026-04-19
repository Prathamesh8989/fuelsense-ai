import axios from 'axios';

// Ensure the URL points to your backend (e.g., http://localhost:5000)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* =========================================================
   AXIOS INSTANCE
========================================================= */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/* =========================================================
   RESPONSE INTERCEPTOR
   → FIXED: We now return response.data so the UI gets 
     the JSON directly instead of the Axios Metadata.
========================================================= */
api.interceptors.response.use(
  (response) => {
    // Returning response.data ensures 'apiResult' in your 
    // component is the actual JSON payload from the server.
    return response.data;
  },
  (error) => {
    // Enhanced error handling to capture backend messages
    const msg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Request failed';

    console.error(`[API Error]: ${msg}`);
    return Promise.reject(new Error(msg));
  }
);

/* =========================================================
   TRIPS API
========================================================= */

// Triggers the ML Model prediction
export const predictFuel = (data) =>
  api.post('/trips/predict', data);

// Saves the prediction results to the database
export const saveTrip = (data) =>
  api.post('/trips', data);

export const getTrips = () =>
  api.get('/trips');

export const getTripStats = () =>
  api.get('/trips/stats');

export const deleteTrip = (id) =>
  api.delete(`/trips/${id}`);

/* =========================================================
   VEHICLE API
========================================================= */
export const getVehicles = () =>
  api.get('/vehicles');

export const createVehicle = (data) =>
  api.post('/vehicles', data);

export const deleteVehicle = (id) =>
  api.delete(`/vehicles/${id}`);

export default api;