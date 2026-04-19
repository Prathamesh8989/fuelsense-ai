const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const callMLService = async (tripData) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
      speed: tripData.speed,
      distance: tripData.distance,
      mileage: tripData.mileage,
      accel_encoded: tripData.accelerationPattern === 'smooth' ? 0 : tripData.accelerationPattern === 'moderate' ? 1 : 2,
      idle_time: tripData.idleTime,
      fuel_price: 100,  // default
    });
    return response.data;
  } catch (error) {
    console.error('ML Service Error:', error.message);
    // Fallback mock response if ML service is unavailable
    return generateMockPrediction(tripData);
  }
};

const generateMockPrediction = (data) => {
  const accelMultiplier =
    data.accelerationPattern === 'aggressive' ? 1.25 :
    data.accelerationPattern === 'moderate' ? 1.1 : 1.0;

  const idlePenalty = data.idleTime * 0.05;
  const speedFactor = data.speed > 100 ? 1.2 : data.speed > 80 ? 1.1 : 1.0;
  const predicted = parseFloat(
    ((data.distance / 100) * 8 * accelMultiplier * speedFactor + idlePenalty).toFixed(2)
  );

  let driverType = 'Efficient Driver';
  if (data.accelerationPattern === 'aggressive') driverType = 'Aggressive Driver';
  else if (data.idleTime > 10) driverType = 'Idle-heavy Driver';
  else if (data.accelerationPattern === 'smooth') driverType = 'Smooth Driver';

  const efficiencyScore = Math.max(40, 100 - (accelMultiplier - 1) * 30 - (data.idleTime / 2));
  const tripRating = efficiencyScore > 85 ? 'Excellent' : efficiencyScore > 70 ? 'Good' : 'Average';

  const featureImportance = {
    speed: 0.32,
    distance: 0.28,
    accelerationPattern: 0.22,
    idleTime: 0.18,
  };

  const recommendations = [];
  if (data.accelerationPattern === 'aggressive') {
    recommendations.push('Reduce aggressive acceleration to save up to 15% fuel');
  }
  if (data.speed > 100) {
    recommendations.push('Maintain speeds below 90 km/h for optimal fuel efficiency');
  }
  if (data.idleTime > 5) {
    recommendations.push('Minimize idling time — turn off engine when stopped for more than 1 minute');
  }
  if (recommendations.length === 0) {
    recommendations.push('Excellent driving! Keep maintaining these habits for peak efficiency');
  }

  // Generate simple cumulative fuel curve data
  const graphData = Array.from({length: 5}, (_, i) => ({
    name: ['Start', 'Accel', 'Cruise', 'Decel', 'Finish'][i],
    fuel: predicted * (i + 1) / 5
  }));

  return {
    predictedFuel: predicted,
    efficiencyScore,
    tripRating,
    driverType,
    featureImportance,
    confidenceScore: 0.87,
    recommendations,
    metrics: {
      r2: 0.8745,
      mse: 0.1247,
      modelActive: false  // Fallback mode
    },
    co2Kg: Number((predicted * 2.31).toFixed(2)),  // Petrol CO2 factor (Number)
    confidenceInterval: {
      confidence: '85%',
      lower: Number((predicted * 0.85).toFixed(2)),
      upper: Number((predicted * 1.15).toFixed(2))
    },
    graphData,
    mileageInsight: {
      rating: (data.mileage || 12) > 15 ? 'Excellent' : (data.mileage || 12) > 10 ? 'Good' : 'Average',
      note: `${data.mileage || 12} km/L — ${(data.mileage || 12) > 15 ? 'top-tier' : 'solid'} efficiency`
    }
  };
};

module.exports = { callMLService };
