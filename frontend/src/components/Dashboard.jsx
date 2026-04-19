import React, { useState } from 'react';
import { saveTrip, predictFuel } from '../services/api';
import { fmtFuel, fmtCost, ecoScoreColor, ecoScoreHex, fmt } from '../utils/helpers';
import { FeatureImportanceChart } from './Charts';
import RecommendationCard from './RecommendationCard';
import Loader, { SkeletonCard } from './Loader';

/* ── Eco Score Ring ── */
function EcoRing({ score }) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const hex = ecoScoreHex(score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Track */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border-color)" strokeWidth="8" />
        {/* Arc */}
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={hex}
          strokeWidth="8"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease' }}
        />
        <text x="60" y="56" textAnchor="middle" fill={hex}
          style={{ fontFamily: '"Playfair Display",serif', fontSize: '22px', fontWeight: 700 }}>
          {score}
        </text>
        <text x="60" y="72" textAnchor="middle" fill="var(--text-muted)"
          style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '9px', letterSpacing: '0.1em' }}>
          ECO SCORE
        </text>
      </svg>
    </div>
  );
}

/* ── Stat Tile ── */
function StatTile({ label, value, unit, icon, delay = 0 }) {
  return (
    <div
      className="card p-4 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="input-label" style={{ marginBottom: '0.5rem' }}>{label}</p>
          <p className="stat-number">{value}</p>
          {unit && (
            <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {unit}
            </p>
          )}
        </div>
        <span style={{ fontSize: '1.5rem', opacity: 0.6 }}>{icon}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Dashboard Export
══════════════════════════════════════════ */
export default function Dashboard({ onTripSaved }) {
  const [form, setForm] = useState({
    speed: '',
    distance: '',
    mileage: '',
    accelerationPattern: 'moderate',
    idleTime: '',
    fuelPrice: '',
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    const values = [+form.speed, +form.distance, +form.mileage, +form.idleTime].filter(v => !isNaN(v));
    if (values.length !== 4 || values.some(v => v <= 0)) {
      setError('Please fill all fields with valid positive numbers.');
      return false;
    }
    return true;
  };

  /* Predict only */
  const handlePredict = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const res = await predictFuel({
        speed: +form.speed,
        distance: +form.distance,
        mileage: +form.mileage,
        accelerationPattern: form.accelerationPattern,
        idleTime: +form.idleTime,
      });
      setPrediction(res.prediction);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* Save trip */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setError('');
    try {
      const res = await saveTrip({
        speed: +form.speed,
        distance: +form.distance,
        mileage: +form.mileage,
        accelerationPattern: form.accelerationPattern,
        idleTime: +form.idleTime,
        fuelPrice: form.fuelPrice ? +form.fuelPrice : undefined,
      });
      setPrediction(res.prediction);
      if (onTripSaved) onTripSaved(res.trip);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const costEstimate =
    prediction && form.fuelPrice
      ? fmtCost(prediction.predictedFuel * +form.fuelPrice)
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Input card ── */}
      <div className="card p-6 animate-fade-in">
        <p className="section-title" style={{ marginBottom: '0.3rem' }}>Trip Input</p>
        <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Enter your driving parameters to receive an AI-powered fuel analysis
        </p>

        <div className="gold-divider" style={{ marginBottom: '1.5rem' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
{[
            { name: 'speed',    label: 'Avg Speed',   placeholder: '80', unit: 'km/h' },
            { name: 'distance', label: 'Distance',     placeholder: '50', unit: 'km'   },
            { name: 'mileage', label: 'Vehicle Mileage', placeholder: '15', unit: 'km/L' },
            { name: 'idleTime', label: 'Idle Time',    placeholder: '5',  unit: 'min'  },
            { name: 'fuelPrice',label: 'Fuel Price',   placeholder: '100', unit: '₹/L' },
          ].map(({ name, label, placeholder, unit }) => (
            <div key={name}>
              <label className="input-label">{label} <span style={{ color: 'var(--text-muted)' }}>({unit})</span></label>
              <input
                className="input-field"
                type="number"
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                min="0"
              />
            </div>
          ))}

          <div>
            <label className="input-label">Acceleration Pattern</label>
            <select className="input-field" name="accelerationPattern" value={form.accelerationPattern} onChange={handleChange}>
              <option value="smooth">Smooth</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
        </div>

        {error && (
          <p style={{ color: '#e05252', fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.75rem', marginTop: '1rem' }}>
            ⚠ {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button className="btn-gold" onClick={handlePredict} disabled={loading}>
            {loading ? 'Analysing...' : '⚡ Predict'}
          </button>
          <button className="btn-ghost" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Trip'}
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {(loading || saving) && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader text="Running ML model..." size="md" />
        </div>
      )}

      {/* ── Results ── */}
      {prediction && !loading && !saving && (
        <>
          {/* Stat row */}
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <StatTile label="Predicted Fuel" value={fmt(prediction.predictedFuel)} unit="litres" icon="⛽" delay={0} />
            <StatTile label="Driver Type"    value={prediction.driverType?.split(' ')[0]} unit={prediction.driverType?.split(' ').slice(1).join(' ')} icon="🚗" delay={80} />
            <StatTile label="Confidence"     value={`${(prediction.confidenceScore * 100).toFixed(0)}%`} unit="model accuracy" icon="🧠" delay={160} />
            {costEstimate && (
              <StatTile label="Est. Cost" value={costEstimate} unit="based on fuel price" icon="💰" delay={240} />
            )}
          </div>

          {/* Eco + Feature importance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', alignItems: 'start' }}
               className="flex-col-on-mobile">
            <div className="card p-5 animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '160px' }}>
              <EcoRing score={
                (() => {
                  let s = 100;
                  if (form.accelerationPattern === 'aggressive') s -= 30;
                  else if (form.accelerationPattern === 'moderate') s -= 10;
                  if (+form.idleTime > 15) s -= 20;
                  else if (+form.idleTime > 5) s -= 10;
                  if (+form.speed > 120) s -= 20;
                  else if (+form.speed > 90) s -= 10;
                  return Math.max(0, s);
                })()
              } />
            </div>

            <FeatureImportanceChart featureImportance={prediction.featureImportance} />
          </div>

          {/* Recommendations */}
          <RecommendationCard
            recommendations={prediction.recommendations}
            driverType={prediction.driverType}
            confidenceScore={prediction.confidenceScore}
          />
        </>
      )}
    </div>
  );
}
