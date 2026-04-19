import React, { useState, useRef } from 'react';
import { predictFuel, saveTrip } from '../services/api';
import Loader from '../components/Loader';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, Cell,
} from 'recharts';
import {
  Zap, Save, Leaf, Fuel, AlertTriangle,
  Gauge, Info, CheckCircle,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const GOLD        = '#d4af37';
const GOLD_LIGHT  = 'rgba(212,175,55,0.15)';
const CHART_COLORS = [GOLD, '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

const RATING_META = {
  Excellent: { color: '#059669', icon: '🏆' },
  Good:      { color: '#16a34a', icon: '✅' },
  Average:   { color: '#d97706', icon: '⚠️' },
  Poor:      { color: '#dc2626', icon: '🔴' },
};
const DRIVER_META = {
  'Smooth Driver':     { icon: '🎯', color: '#059669' },
  'Efficient Driver':  { icon: '⚡', color: '#2563eb' },
  'Moderate Driver':   { icon: '🚗', color: '#d97706' },
  'Aggressive Driver': { icon: '🔥', color: '#dc2626' },
};

function pct(val, max) { return Math.min(100, Math.max(0, (val / max) * 100)); }

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

function GlassCard({ children, style = {}, className = '' }) {
  return (
    <div className={className} style={{
      background: 'var(--bg-card)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '0.5px solid var(--border-color)',
      borderRadius: '16px',
      boxShadow: 'var(--shadow-card)',
      padding: '1.5rem',
      transition: 'all 0.3s ease',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: '0.62rem',
      letterSpacing: '0.22em',
      color: 'var(--accent-gold)',
      textTransform: 'uppercase',
      fontWeight: 600,
      margin: '0 0 0.35rem 0',
    }}>
      {children}
    </p>
  );
}

function GoldDivider() {
  return (
    <div style={{
      height: '1px',
      background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
      margin: '1.25rem 0',
      opacity: 0.5,
    }} />
  );
}

function ArcGauge({ value, max = 100, label, sublabel, color }) {
  const safeValue = isNaN(value) || value === undefined || value === null ? 0 : Math.max(0, Number(value));
  const r = 54, cx = 70, cy = 70;
  const angle = (safeValue / max) * 180;
  const rad = (deg) => (deg * Math.PI) / 180;
  const endX = cx + r * Math.cos(Math.PI - rad(angle));
  const endY = cy - r * Math.sin(rad(angle));
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={140} height={85} viewBox="0 0 140 85">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="var(--border-color)" strokeWidth={10} strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
          style={{ transition: 'all 1s ease' }} />
        <text x={cx} y={cy - 6} textAnchor="middle"
          style={{ fontFamily: '"Cinzel",serif', fontSize: '1.4rem', fontWeight: 700, fill: color }}>
          {Math.round(safeValue)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle"
          style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.55rem', fill: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          {sublabel}
        </text>
      </svg>
      <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>
        {label}
      </p>
    </div>
  );
}

function StatPill({ icon, label, value, sub, accent = false }) {
  return (
    <div style={{
      background: accent ? `linear-gradient(135deg, ${GOLD_LIGHT}, var(--bg-card))` : 'var(--bg-card)',
      border: `0.5px solid ${accent ? 'var(--border-bright)' : 'var(--border-color)'}`,
      borderRadius: '12px',
      padding: '1.1rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: '0.85rem',
      backdropFilter: 'blur(16px)',
      transition: 'all 0.3s',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: '10px',
        background: accent ? 'rgba(212,175,55,0.18)' : 'rgba(212,175,55,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent-gold)', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>
          {label}
        </p>
        <p style={{ fontFamily: '"Cinzel",serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, margin: '0.1rem 0 0' }}>
          {value}
        </p>
        {sub && (
          <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max = 100, color, explain }) {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.75rem', color: color || GOLD, fontWeight: 600 }}>
          {typeof value === 'number' ? value.toFixed(3) : value}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--border-color)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${pct(value, max)}%`,
          background: `linear-gradient(90deg, ${color || GOLD}, ${color || GOLD}aa)`,
          transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 8px ${color || GOLD}66`,
        }} />
      </div>
      {explain && (
        <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>
          {explain}
        </p>
      )}
    </div>
  );
}

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span
        style={{ cursor: 'pointer', color: 'var(--text-muted)', marginLeft: 4, display: 'inline-flex' }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <Info size={13} />
      </span>
      {show && (
        <div style={{
          position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
          borderRadius: 8, padding: '0.5rem 0.75rem', width: 200,
          fontSize: '0.75rem', color: 'var(--text-secondary)', zIndex: 200,
          fontFamily: '"Cormorant Garamond",serif', lineHeight: 1.5,
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(16px)',
          pointerEvents: 'none',
        }}>
          {text}
        </div>
      )}
    </span>
  );
}

const chartTooltipStyle = {
  background: 'var(--bg-card)',
  border: '0.5px solid var(--border-color)',
  borderRadius: 8,
  fontFamily: '"IBM Plex Mono",monospace',
  fontSize: 10,
  color: 'var(--text-primary)',
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Home({ theme, toggleTheme }) {
  const [formData, setFormData] = useState({
    speed: 80, distance: 50, mileage: 12,
    accelerationPattern: 'moderate', idleTime: 5, fuelPrice: 100,
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [saved, setSaved]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const resultsRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const val = name === 'accelerationPattern' ? value : parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!formData.distance || !formData.speed || !formData.mileage) {
      setError('Please fill Distance, Speed, and Mileage to continue.');
      return;
    }

    const payload = {
      speed: Number(formData.speed),
      distance: Number(formData.distance),
      mileage: Number(formData.mileage),
      accelerationPattern: formData.accelerationPattern,
      idleTime: Number(formData.idleTime),
      fuelPrice: Number(formData.fuelPrice),
    };

    setLoading(true); setError(''); setPrediction(null); setSaved(false);
    try {
      const apiResult = await predictFuel(payload);
      // Handle both wrapped { prediction: {...} } and flat response shapes
      setPrediction(apiResult.prediction || apiResult);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError('Prediction failed. Please check your inputs and try again.');
      console.error('Predict error:', err);
    } finally {
      setLoading(false);
    }
  };

  // const handleSave = async () => {
  //   if (!prediction) return;
  //   setSaving(true);
  //   try {
  //     // Send only the fields the backend expects for saving a trip
  //     await saveTrip({
  //       speed: formData.speed,
  //       distance: formData.distance,
  //       fuelUsed: 0,
  //       accelerationPattern: formData.accelerationPattern,
  //       idleTime: formData.idleTime,
  //       predictedFuel: prediction.predictedFuel,
  //       driverType: prediction.driverType,
  //       fuelPrice: formData.fuelPrice,
  //     });
  //     setSaved(true);
  //   } catch (err) {
  //     setError('Could not save trip. Please try again.');
  //     console.error('Save error:', err);
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  const handleSave = async () => {
  if (!prediction) return;
  setSaving(true);
  try {
    const payload = {
      // 1. Mandatory Fields (Must match your schema requirements)
      speed: Number(formData.speed),
      distance: Number(formData.distance),
      mileage: Number(formData.mileage), // CRITICAL: This was missing!
      accelerationPattern: formData.accelerationPattern,
      idleTime: Number(formData.idleTime),

      // 2. Predictive Data (Optional in schema, but good for Analytics)
      predictedFuel: prediction.predictedFuel,
      driverType: prediction.driverType,
      fuelPrice: Number(formData.fuelPrice),
      
      // 3. Extra Model Data (Optional but fits your schema)
      // Check if your backend uses confidenceInterval.confidence or similar
      confidenceScore: prediction.confidenceInterval ? 0.95 : 0.9, 
      featureImportance: prediction.featureImportance || {},
      recommendations: prediction.recommendations || [],
      
      // Calculated Fields
      estimatedCost: Number(prediction.predictedFuel * formData.fuelPrice)
    };

    console.log("Sending Payload to Backend:", payload);
    await saveTrip(payload);
    
    setSaved(true);
    setError('');
  } catch (err) {
    setError('Save Failed: ' + err.message);
    console.error("Save Error Details:", err);
  } finally {
    setSaving(false);
  }
};

  /* derived chart data */
  const featureData = prediction?.featureImportance
    ? Object.entries(prediction.featureImportance)
        .map(([k, v]) => ({ name: k, value: Number(v) }))
        .sort((a, b) => b.value - a.value)
    : [];

  // Safe fallbacks for rating/driver meta — never crashes if backend returns unexpected value
  const ratingMeta = prediction
    ? (RATING_META[prediction.tripRating] || RATING_META['Good'])
    : null;
  const driverMeta = prediction
    ? (DRIVER_META[prediction.driverType] || DRIVER_META['Efficient Driver'])
    : null;

  const inputStyle = {
    background: 'var(--bg-secondary)',
    border: '0.5px solid var(--border-color)',
    borderRadius: '10px',
    padding: '0.7rem 1rem',
    color: 'var(--text-primary)',
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: '0.88rem',
    width: '100%',
    outline: 'none',
    transition: 'border 0.2s ease, box-shadow 0.2s ease',
    backdropFilter: 'blur(10px)',
  };

  const labelStyle = {
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: '0.6rem',
    letterSpacing: '0.18em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.35rem',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        @keyframes fs-slideUp  { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fs-fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes fs-stagger  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

        .fs-fade-in   { animation: fs-fadeIn  0.7s ease both; }
        .fs-slide-up  { animation: fs-slideUp 0.55s ease both; }
        .fs-s1 { animation: fs-stagger 0.5s 0.05s ease both; }
        .fs-s2 { animation: fs-stagger 0.5s 0.15s ease both; }
        .fs-s3 { animation: fs-stagger 0.5s 0.25s ease both; }
        .fs-s4 { animation: fs-stagger 0.5s 0.35s ease both; }
        .fs-s5 { animation: fs-stagger 0.5s 0.45s ease both; }

        .fs-input:focus {
          border-color: ${GOLD} !important;
          box-shadow: 0 0 0 3px rgba(212,175,55,0.15) !important;
        }
        .fs-card-lift { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .fs-card-lift:hover { transform: translateY(-3px); box-shadow: 0 20px 55px rgba(0,0,0,0.18) !important; }

        .fs-btn-primary {
          background: linear-gradient(135deg, #d4af37, #b8922a);
          color: #0a0a0a;
          border: none; border-radius: 10px;
          padding: 0.75rem 1.75rem;
          font-family: "IBM Plex Mono", monospace;
          font-size: 0.82rem; font-weight: 600; letter-spacing: 0.12em;
          cursor: pointer; transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(212,175,55,0.35);
          display: inline-flex; align-items: center; gap: 0.5rem;
          min-height: 44px;
        }
        .fs-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(212,175,55,0.5); }
        .fs-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .fs-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .fs-btn-ghost {
          background: transparent;
          border: 0.5px solid ${GOLD};
          color: ${GOLD};
          border-radius: 10px;
          padding: 0.7rem 1.5rem;
          font-family: "IBM Plex Mono", monospace;
          font-size: 0.82rem; font-weight: 500; letter-spacing: 0.12em;
          cursor: pointer; transition: all 0.25s ease;
          display: inline-flex; align-items: center; gap: 0.4rem;
          min-height: 44px;
        }
        .fs-btn-ghost:hover:not(:disabled) { background: rgba(212,175,55,0.12); transform: translateY(-1px); }
        .fs-btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=range] {
          -webkit-appearance: none; appearance: none;
          height: 4px; border-radius: 99px; outline: none; cursor: pointer;
          background: var(--border-color);
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px;
          border-radius: 50%; background: ${GOLD}; cursor: pointer;
          box-shadow: 0 0 6px ${GOLD}88;
        }
        ::selection { background: ${GOLD}33; }
      `}</style>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '5.5rem 1.5rem 4rem' }}>

        {/* ── HERO ── */}
        <div className="fs-fade-in" style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.62rem', letterSpacing: '0.22em', color: GOLD, margin: '0 0 0.5rem' }}>
            AI-POWERED FUEL INTELLIGENCE
          </p>
          <h1 style={{ fontFamily: '"Cinzel",serif', fontSize: 'clamp(1.9rem,4vw,2.9rem)', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-primary)', margin: 0, lineHeight: 1.15 }}>
            FuelSense <span style={{ color: GOLD }}>Dashboard</span>
          </h1>
          <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: '0.6rem', maxWidth: 520, lineHeight: 1.65 }}>
            Enter your trip parameters to receive an intelligent prediction of fuel consumption,
            CO₂ footprint, driver behaviour analysis, and personalised optimisation strategies.
          </p>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)`, maxWidth: 180, marginTop: '1.2rem', opacity: 0.7 }} />
        </div>

        {/* ── FORM CARD ── */}
        <GlassCard className="fs-s1" style={{ marginBottom: '2rem' }}>
          <SectionLabel>Trip Parameters</SectionLabel>
          <h2 style={{ fontFamily: '"Cinzel",serif', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0.2rem 0 1.5rem' }}>
            Configure Your Journey
          </h2>

          <form onSubmit={handlePredict}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.1rem', marginBottom: '1.25rem' }}>

              {[
                { name: 'speed',     label: 'Avg Speed (km/h)', tip: 'Higher speeds beyond 80 km/h raise fuel consumption via aerodynamic drag.' },
                { name: 'distance',  label: 'Distance (km)',     tip: 'Total trip length — the primary driver of absolute fuel usage.' },
                { name: 'mileage',   label: 'Mileage (km/L)',   tip: "Your vehicle's average fuel efficiency. Higher is better." },
                { name: 'idleTime',  label: 'Idle Time (min)',   tip: 'Engine idling burns fuel with zero distance covered.' },
                { name: 'fuelPrice', label: 'Fuel Price (₹/L)',  tip: 'Current price per litre — used only for cost estimation.' },
              ].map(({ name, label, tip }) => (
                <div key={name}>
                  <label style={labelStyle}>
                    {label} <InfoTooltip text={tip} />
                  </label>
                  <input
                    className="fs-input"
                    style={inputStyle}
                    type="number"
                    name={name}
                    value={formData[name]}
                    onChange={handleInputChange}
                  />
                </div>
              ))}

              <div>
                <label style={labelStyle}>
                  Acceleration Style
                  <InfoTooltip text="Hard acceleration can consume up to 40% more fuel through repeated braking cycles." />
                </label>
                {/* FIX: was 'Aggressiven' (typo) — corrected to 'Aggressive' */}
                <select
                  className="fs-input"
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  name="accelerationPattern"
                  value={formData.accelerationPattern}
                  onChange={handleInputChange}
                >
                  <option value="smooth">🟢  Smooth</option>
                  <option value="moderate">🟡  Moderate</option>
                  <option value="aggressive">🔴  Aggressive</option>
                </select>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(220,38,38,0.1)', border: '0.5px solid rgba(220,38,38,0.4)',
                borderRadius: '8px', padding: '0.6rem 1rem', marginBottom: '1rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontFamily: '"Cormorant Garamond",serif', fontSize: '0.9rem', color: '#ef4444',
              }}>
                <AlertTriangle size={15} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="submit" className="fs-btn-primary" disabled={loading}>
                {loading ? <Loader size="sm" text="" /> : '⚡ Predict Fuel'}
              </button>

              {prediction && (
                <button type="button" className="fs-btn-ghost" onClick={handleSave} disabled={saving || saved}>
                  {saved ? '✅ Saved!' : saving ? <Loader size="sm" text="" /> : <><Save size={14} /> Save Trip</>}
                </button>
              )}
            </div>
          </form>
        </GlassCard>

        {/* ── LOADING STATE ── */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
            <Loader size="lg" text="Analysing trip parameters…" />
          </div>
        )}

        {/* ── RESULTS ── */}
        {prediction && !loading && ratingMeta && driverMeta && (
          <div ref={resultsRef} className="fs-slide-up">

            {/* VERDICT */}
            <GlassCard className="fs-s1" style={{
              marginBottom: '1.5rem',
              border: `0.5px solid ${ratingMeta.color}44`,
              background: `linear-gradient(135deg, ${ratingMeta.color}0d, var(--bg-card))`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <SectionLabel>Trip Verdict</SectionLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.4rem' }}>
                    <span style={{ fontSize: '1.9rem' }}>{ratingMeta.icon}</span>
                    <div>
                      <h2 style={{ fontFamily: '"Cinzel",serif', fontSize: '1.5rem', fontWeight: 700, color: ratingMeta.color, margin: 0 }}>
                        {prediction.tripRating}
                      </h2>
                      <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {driverMeta.icon} {prediction.driverType}
                      </p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <ArcGauge value={prediction.efficiencyScore || 0} max={100} label="Efficiency Score" sublabel="/ 100" color={ratingMeta.color} />
                  {prediction.confidenceInterval && (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.2rem' }}>
                        Confidence
                      </p>
                      <p style={{ fontFamily: '"Cinzel",serif', fontSize: '1.4rem', fontWeight: 700, color: GOLD, margin: 0 }}>
                        {prediction.confidenceInterval.confidence}
                      </p>
                      <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                        [{(prediction.confidenceInterval.lower || 0).toFixed(2)} – {(prediction.confidenceInterval.upper || 0).toFixed(2)} L]
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* PRIMARY METRICS */}
            <div className="fs-s2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <StatPill icon={<Fuel size={20} />}  label="Predicted Fuel" value={`${(prediction.predictedFuel || 0).toFixed(2)} L`} sub="For this journey" accent />
              <StatPill icon={<Zap size={20} />}   label="Total Cost"     value={`₹${((prediction.predictedFuel || 0) * formData.fuelPrice).toFixed(2)}`} sub={`@ ₹${formData.fuelPrice}/L`} />
              <StatPill icon={<Leaf size={20} />}  label="CO₂ Emitted"   value={`${(prediction.co2Kg || 0).toFixed(2)} kg`} sub="Carbon footprint" />
              {prediction.mileageInsight && (
                <StatPill icon={<Gauge size={20} />} label="Mileage Rating" value={prediction.mileageInsight.rating} sub={prediction.mileageInsight.note} />
              )}
            </div>

            {/* FUEL CURVE + MODEL METRICS */}
            <div className="fs-s3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

              <GlassCard className="fs-card-lift" style={{ padding: '1.25rem' }}>
                <SectionLabel>Cumulative Fuel Curve</SectionLabel>
                <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.75rem' }}>
                  Shows how fuel is consumed progressively across trip phases.
                </p>
                {prediction.graphData && prediction.graphData.length > 0 ? (
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prediction.graphData}>
                        <XAxis dataKey="name" tick={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Line type="monotone" dataKey="fuel" stroke={GOLD} strokeWidth={2.5} dot={{ fill: GOLD, r: 4 }} activeDot={{ r: 6, fill: GOLD }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontFamily: '"Cormorant Garamond",serif', fontSize: '0.85rem' }}>No graph data available.</p>
                )}
              </GlassCard>

              <GlassCard className="fs-card-lift" style={{ padding: '1.25rem' }}>
                <SectionLabel>Model Performance</SectionLabel>
                <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 1rem' }}>
                  Metrics from the ML regression model powering this prediction.
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem' }}>
                  <div>
                    <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.2rem', display: 'flex', alignItems: 'center' }}>
                      R² Score <InfoTooltip text="Coefficient of determination — measures how well the model explains variance, 0.0 is worst, 1.0 is perfect." />
                    </p>
                    <p style={{ fontFamily: '"Cinzel",serif', fontSize: '2rem', fontWeight: 700, color: (prediction.metrics?.r2 || 0) > 0.9 ? '#10b981' : GOLD, lineHeight: 1, margin: 0 }}>
                      {(prediction.metrics?.r2 || 0).toFixed(4)}
                    </p>
                    <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                      {(prediction.metrics?.r2 || 0) > 0.95 ? '🏆 Exceptional fit' : (prediction.metrics?.r2 || 0) > 0.85 ? '✅ Strong model' : '⚠️ Moderate fit'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.2rem', display: 'flex', alignItems: 'center' }}>
                      MSE <InfoTooltip text="Mean Squared Error — average squared difference between predicted and actual values. Lower is better." />
                    </p>
                    <p style={{ fontFamily: '"Cinzel",serif', fontSize: '2rem', fontWeight: 700, color: GOLD, lineHeight: 1, margin: 0 }}>
                      {(prediction.metrics?.mse || 0).toFixed(4)}
                    </p>
                    <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                      Prediction error
                    </p>
                  </div>
                </div>
                <GoldDivider />
                <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>
                  Model Status
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: prediction.metrics?.modelActive ? '#10b981' : '#ef4444',
                    boxShadow: prediction.metrics?.modelActive ? '0 0 8px #10b98188' : 'none',
                  }} />
                  <span style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.88rem', color: prediction.metrics?.modelActive ? '#10b981' : '#ef4444' }}>
                    {prediction.metrics?.modelActive ? 'Live ML Model — Real predictions' : 'Fallback Mode'}
                  </span>
                </div>
              </GlassCard>
            </div>

            {/* FEATURE IMPORTANCE BAR CHART */}
            {featureData.length > 0 && (
              <GlassCard className="fs-s4 fs-card-lift" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
                <SectionLabel>Feature Importance</SectionLabel>
                <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.75rem' }}>
                  Which factors most influenced this fuel prediction.
                </p>
                <div style={{ marginBottom: '0.75rem' }}>
                  {featureData.map((f, i) => (
                    <ProgressBar
                      key={f.name}
                      label={f.name}
                      value={f.value}
                      max={Math.max(...featureData.map(d => d.value))}
                      color={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </div>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={featureData} layout="vertical">
                      <XAxis type="number" tick={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {featureData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}

            {/* RADAR */}
            {featureData.length > 2 && (
              <GlassCard className="fs-s5" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
                <SectionLabel>Input Factor Radar</SectionLabel>
                <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.75rem' }}>
                  A holistic view of how all parameters collectively shape your fuel prediction.
                </p>
                <div style={{ height: 260, display: 'flex', justifyContent: 'center' }}>
                  <ResponsiveContainer width="70%" height="100%">
                    <RadarChart data={featureData}>
                      <PolarGrid stroke="var(--border-color)" />
                      <PolarAngleAxis dataKey="name" tick={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, fill: 'var(--text-muted)' }} />
                      <Radar dataKey="value" stroke={GOLD} fill={GOLD} fillOpacity={0.22} strokeWidth={2} dot={{ fill: GOLD, r: 3 }} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}

            {/* RECOMMENDATIONS */}
            {(prediction.recommendations?.length || 0) > 0 && (
              <GlassCard style={{
                marginBottom: '1.25rem', padding: '1.25rem',
                border: `0.5px solid ${GOLD}33`,
                background: `linear-gradient(135deg, ${GOLD}08, var(--bg-card))`,
              }}>
                <SectionLabel>Personalised Recommendations</SectionLabel>
                <h3 style={{ fontFamily: '"Cinzel",serif', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0.2rem 0 1rem' }}>
                  Optimisation Strategies for This Trip
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {prediction.recommendations.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '6px', background: GOLD_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <CheckCircle size={13} color={GOLD} />
                      </div>
                      <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                        {r}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* TRIP INPUT SUMMARY */}
            <GlassCard style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
              <SectionLabel>Trip Input Summary</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                {[
                  { label: 'Speed',        val: `${formData.speed} km/h` },
                  { label: 'Distance',     val: `${formData.distance} km` },
                  { label: 'Mileage',      val: `${formData.mileage} km/L` },
                  { label: 'Idle Time',    val: `${formData.idleTime} min` },
                  { label: 'Acceleration', val: formData.accelerationPattern },
                  { label: 'Fuel Price',   val: `₹${formData.fuelPrice}/L` },
                ].map(({ label, val }) => (
                  <div key={label} style={{
                    background: 'var(--bg-secondary)', border: '0.5px solid var(--border-color)',
                    borderRadius: '10px', padding: '0.7rem 1rem', backdropFilter: 'blur(10px)',
                  }}>
                    <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.58rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.25rem' }}>
                      {label}
                    </p>
                    <p style={{ fontFamily: '"Cinzel",serif', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, textTransform: 'capitalize' }}>
                      {val}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* ACTION ROW */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                className="fs-btn-ghost"
                onClick={() => { setPrediction(null); setSaved(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                ← New Prediction
              </button>
              <button className="fs-btn-ghost" onClick={handleSave} disabled={saving || saved}>
                {saved ? '✅ Trip Saved' : saving ? <Loader size="sm" text="" /> : <><Save size={14} /> Save Trip</>}
              </button>
            </div>

          </div>
        )}
      </div>
    </>
  );
}