const axios = require('axios');

// Load API key ONLY from environment (no fallback for security)
const ORS_API_KEY = process.env.ORS_API_KEY;

// if (!ORS_API_KEY) {
  //   throw new Error("❌ ORS_API_KEY is missing in .env file");
  // }
  console.log('Route service MOCK mode - no ORS_API_KEY needed');

const ORS_BASE = 'https://api.openrouteservice.org';

// Axios instance with correct headers (NO Bearer)
const api = axios.create({
  timeout: 10000,
  headers: {
    Authorization: ORS_API_KEY, // ✅ Correct format
    'Content-Type': 'application/json',
  },
});

// 🔹 Retry logic with exponential backoff
const withRetry = async (fn, maxRetries = 2) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries || !error.response?.status?.toString().startsWith('5')) {
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};

// 🔹 Geocode address to lat/lng
// const geocode = async (address) => {
//   return withRetry(async () => {
//     try {
//       const { data } = await api.get(`${ORS_BASE}/geocode/search`, {
//         params: {
//           text: address,
//           size: 1,
//         },
//       });

//       if (!data.features || data.features.length === 0) {
//         throw new Error('Address not found');
//       }

//       const [lng, lat] = data.features[0].geometry.coordinates;

//       return {
//         lat,
//         lng,
//         display_name: data.features[0].properties.label,
//       };
//     } catch (error) {
//       console.error("❌ Geocode Error:", error.response?.data || error.message);
//       throw new Error("Geocoding failed");
//     }
//   });
// };

// 🔹 Geocode address to lat/lng
const geocode = async (address) => {
  // FIX: Force address to be a string (scalar) even if an object is passed
  const queryText = typeof address === 'object' ? (address.address || address.origin || address.text) : address;

  if (!queryText || typeof queryText !== 'string' || queryText.trim().length === 0) {
    console.error("❌ Geocode Error: Input is not a valid string", address);
    throw new Error("Invalid address: 'text' parameter must be a non-empty string.");
  }

  return withRetry(async () => {
    try {
      const { data } = await api.get(`${ORS_BASE}/geocode/search`, {
        params: {
          text: queryText.trim(),
          size: 1,
        },
      });

      if (!data.features || data.features.length === 0) {
        throw new Error(`Address not found: ${queryText}`);
      }

      const [lng, lat] = data.features[0].geometry.coordinates;

      return {
        lat,
        lng,
        display_name: data.features[0].properties.label,
      };
    } catch (error) {
      // This logs the specific Pelias error you saw in your console
      console.error("❌ Geocode API Error:", error.response?.data || error.message);
      throw error; 
    }
  });
};
// 🔹 Get route geometry and metadata
const getRoute = async (start, end) => {
  try {
    // 1. Convert address strings to real coordinates
    const startLocation = await geocode(start);
    const endLocation = await geocode(end);

    // 2. Call ORS Directions API for real road geometry
    const response = await api.post(`${ORS_BASE}/v2/directions/driving-car`, {
      coordinates: [
        [startLocation.lng, startLocation.lat],
        [endLocation.lng, endLocation.lat]
      ],
      units: 'km'
    });

    const route = response.data.routes[0];
    const summary = route.summary;

    return {
      // Use real data from API instead of 150
      distanceKm: parseFloat(summary.distance.toFixed(1)),
      durationMin: parseFloat((summary.duration / 60).toFixed(0)),
      avgSpeed: parseFloat((summary.distance / (summary.duration / 3600)).toFixed(0)),
      // ORS returns [lng, lat] pairs in geometry.coordinates
      geometry: route.geometry ? decodePolyline(route.geometry) : [] 
    };
  } catch (error) {
    console.error("❌ Route Service Error:", error.response?.data || error.message);
    throw new Error("Failed to fetch real road route. Check your API Key.");
  }
};

// 🔹 Helper to decode OpenRouteService polylines
function decodePolyline(encoded) {
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    // ORS returns [lng, lat], so we stay consistent with that
    points.push([lng / 1e5, lat / 1e5]);
  }
  return points;
}
/**
 * ORS uses polyline encoding by default. 
 * If you aren't using a polyline library, ensure your ORS call 
 * is configured for "geojson" format to get raw coordinates.
 */

module.exports = { geocode, getRoute };