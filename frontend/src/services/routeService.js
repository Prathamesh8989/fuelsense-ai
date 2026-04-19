import api from './api';
 
// Geocode address to lat/lng (used standalone if needed)
// interceptor already unwraps res.data — do not destructure { data }
export const geocode = async (address) => {
  return await api.post('/routes/geocode', { address });
};
 
// Get optimized route — sends raw address strings
// backend controller handles geocoding internally
export const getRoute = async (origin, destination) => {
  return await api.post('/routes/routes', { origin, destination });
};