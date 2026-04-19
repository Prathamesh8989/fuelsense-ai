/**
 * Format a number to fixed decimal places
 */
export const fmt = (num, dec = 2) =>
  typeof num === 'number' ? num.toFixed(dec) : '—';

/**
 * Format fuel consumption as L/100km
 */
export const fmtFuel = (liters) =>
  typeof liters === 'number' ? `${liters.toFixed(2)} L` : '—';

/**
 * Format cost in INR
 */
export const fmtCost = (amount) =>
  typeof amount === 'number'
    ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    : '—';

/**
 * Return Tailwind color class based on eco score
 */
export const ecoScoreColor = (score) => {
  if (score >= 70) return 'eco-high';
  if (score >= 40) return 'eco-mid';
  return 'eco-low';
};

/**
 * Return hex color based on eco score
 */
export const ecoScoreHex = (score) => {
  if (score >= 70) return '#4caf7d';
  if (score >= 40) return '#e8c060';
  return '#e05252';
};

/**
 * Convert feature importance object to sorted array for charts
 */
export const importanceToChartData = (featureImportance) => {
  if (!featureImportance) return [];
  const labels = {
    speed: 'Speed',
    distance: 'Distance',
    accel_encoded: 'Acceleration',
    accelerationPattern: 'Acceleration',
    idle_time: 'Idle Time',
    idleTime: 'Idle Time',
  };
  return Object.entries(featureImportance)
    .map(([key, value]) => ({
      feature: labels[key] || key,
      importance: parseFloat((value * 100).toFixed(1)),
      raw: value,
    }))
    .sort((a, b) => b.importance - a.importance);
};

/**
 * Format date to readable string
 */
export const fmtDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get driver type badge color
 */
export const driverTypeColor = (type) => {
  const map = {
    'Efficient Driver': '#4caf7d',
    'Smooth Driver': '#60a5fa',
    'Aggressive Driver': '#e05252',
    'Idle-heavy Driver': '#e8c060',
  };
  return map[type] || '#c9993a';
};

/**
 * Clamp a number between min and max
 */
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
