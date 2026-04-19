import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { importanceToChartData, driverTypeColor } from '../utils/helpers';

/* ── Shared tooltip style ── */
const TooltipStyle = {
  contentStyle: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-bright)',
    borderRadius: '8px',
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: '11px',
    color: 'var(--text-primary)',
  },
  cursor: { fill: 'rgba(201,153,58,0.06)' },
};

/* ══════════════════════════════════════════
   Feature Importance Bar Chart
══════════════════════════════════════════ */
export function FeatureImportanceChart({ featureImportance }) {
  const [animated, setAnimated] = useState(false);
  const data = importanceToChartData(featureImportance);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [featureImportance]);

  const COLORS = ['#c9993a', '#e8c060', '#4caf7d', '#60a5fa'];

  if (!data.length) return null;

  return (
    <div className="card p-5 animate-slide-up">
      <div style={{ marginBottom: '1.2rem' }}>
        <p className="section-title" style={{ marginBottom: '0.25rem' }}>Feature Importance</p>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          What drives your fuel consumption
        </p>
      </div>

      {/* Text insight labels */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.2rem' }}>
        {data.map((d, i) => (
          <span key={d.feature} className="rec-badge" style={{ borderColor: `${COLORS[i]}40`, color: COLORS[i] }}>
            {d.feature}: {d.importance}%
          </span>
        ))}
      </div>

      <div className="gold-divider" style={{ marginBottom: '1.2rem' }} />

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" barSize={18}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 50]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontFamily: '"IBM Plex Mono"', fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="feature"
            width={90}
            tick={{ fontFamily: '"IBM Plex Mono"', fontSize: 10 }}
          />
          <Tooltip
            formatter={(v) => [`${v}%`, 'Importance']}
            {...TooltipStyle}
          />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]} isAnimationActive={animated}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Dominant feature insight */}
      {data[0] && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(201,153,58,0.06)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
          }}
        >
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>
            <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
              {data[0].feature}
            </span>{' '}
            is the dominant factor, contributing{' '}
            <span style={{ color: 'var(--accent-gold)' }}>{data[0].importance}%</span> to fuel consumption.
          </p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Fuel History Line Chart
══════════════════════════════════════════ */
export function FuelHistoryChart({ trips }) {
  const data = trips.slice(0, 15).reverse().map((t, i) => ({
    trip: `T${i + 1}`,
    actual: t.fuelUsed,
    predicted: t.predictedFuel,
    eco: t.ecoScore,
  }));

  return (
    <div className="card p-5">
      <div style={{ marginBottom: '1.2rem' }}>
        <p className="section-title" style={{ marginBottom: '0.25rem' }}>Fuel Consumption Trend</p>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Actual vs. predicted across recent trips
        </p>
      </div>

      <div className="gold-divider" style={{ marginBottom: '1.2rem' }} />

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#c9993a" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#c9993a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#4caf7d" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#4caf7d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="trip" />
          <YAxis tickFormatter={(v) => `${v}L`} />
          <Tooltip
            formatter={(v, name) => [`${v} L`, name]}
            {...TooltipStyle}
          />
          <Legend
            wrapperStyle={{ fontFamily: '"IBM Plex Mono"', fontSize: 10 }}
          />
          <Area type="monotone" dataKey="actual"    stroke="#c9993a" fill="url(#actualGrad)" strokeWidth={2} dot={{ r: 3, fill: '#c9993a' }} name="Actual" />
          <Area type="monotone" dataKey="predicted" stroke="#4caf7d" fill="url(#predGrad)"  strokeWidth={2} dot={{ r: 3, fill: '#4caf7d' }} name="Predicted" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ══════════════════════════════════════════
   Eco Score Line Chart
══════════════════════════════════════════ */
export function EcoScoreChart({ trips }) {
  const data = trips.slice(0, 15).reverse().map((t, i) => ({
    trip: `T${i + 1}`,
    score: t.ecoScore || 0,
  }));

  return (
    <div className="card p-5">
      <div style={{ marginBottom: '1.2rem' }}>
        <p className="section-title" style={{ marginBottom: '0.25rem' }}>Eco Score Trend</p>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Your driving efficiency over time
        </p>
      </div>

      <div className="gold-divider" style={{ marginBottom: '1.2rem' }} />

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="trip" />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}`} />
          <Tooltip formatter={(v) => [`${v}/100`, 'Eco Score']} {...TooltipStyle} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#e8c060"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#e8c060', stroke: 'var(--bg-primary)', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ══════════════════════════════════════════
   Driver Type Pie Chart
══════════════════════════════════════════ */
export function DriverTypePieChart({ driverTypes }) {
  if (!driverTypes?.length) return null;

  const data = driverTypes.map((d) => ({
    name: d._id || 'Unknown',
    value: d.count,
    color: driverTypeColor(d._id),
  }));

  return (
    <div className="card p-5">
      <div style={{ marginBottom: '1.2rem' }}>
        <p className="section-title" style={{ marginBottom: '0.25rem' }}>Driver Behaviour</p>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Cluster distribution across trips
        </p>
      </div>

      <div className="gold-divider" style={{ marginBottom: '1.2rem' }} />

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip
            formatter={(v, n) => [v, n]}
            {...TooltipStyle}
          />
          <Legend
            formatter={(value) => (
              <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 10 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
