const { geocode, getRoute } = require('../services/routeService.js');

const geocodeAddress = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Address required' });
    const location = await geocode(address);
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOptimizedRoute = async (req, res) => {
  try {
    // 1. Explicitly extract strings from the request body
    const { origin, destination } = req.body;

    // 2. Validate that they are actual strings before calling the service
    if (!origin || !destination) {
      return res.status(400).json({ error: "Origin and Destination are required strings." });
    }

    // 3. Call the service with the raw strings
    const routeData = await getRoute(origin, destination);
    
    res.json(routeData);
  } catch (error) {
    console.error("Route Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { geocodeAddress, getOptimizedRoute };

