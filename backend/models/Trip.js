const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    speed: {
      type: Number,
      required: true,
      min: 0,
      max: 300,
    },
    distance: {
      type: Number,
      required: true,
      min: 0,
    },
    mileage: {
      type: Number,
      default: 0,
    },
    accelerationPattern: {
      type: String,
      enum: ['smooth', 'moderate', 'aggressive'],
      required: true,
    },
    idleTime: {
      type: Number,
      required: true,
      min: 0,
    },
    predictedFuel: {
      type: Number,
    },
    driverType: {
      type: String,
      enum: ['Efficient Driver', 'Smooth Driver', 'Aggressive Driver', 'Idle-heavy Driver'],
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    featureImportance: {
      type: Map,
      of: Number,
    },
    recommendations: [
      {
        type: String,
      },
    ],
    fuelPrice: {
      type: Number,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    ecoScore: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Compute eco score before saving
tripSchema.pre('save', function (next) {
  let score = 100;
  if (this.accelerationPattern === 'aggressive') score -= 30;
  else if (this.accelerationPattern === 'moderate') score -= 10;
  if (this.idleTime > 15) score -= 20;
  else if (this.idleTime > 5) score -= 10;
  if (this.speed > 120) score -= 20;
  else if (this.speed > 90) score -= 10;
  this.ecoScore = Math.max(0, score);
  next();
});

const Trip = mongoose.model('Trip', tripSchema);
module.exports = Trip;
