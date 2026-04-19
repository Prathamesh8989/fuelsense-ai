import React, { useState, useEffect } from 'react';
import { getTrips, getTripStats, deleteTrip } from '../services/api';
import { FuelHistoryChart, EcoScoreChart, DriverTypePieChart } from '../components/Charts';
import { fmtFuel, fmtCost, fmtDate, fmt, driverTypeColor } from '../utils/helpers';
import { SkeletonCard } from '../components/Loader';

/* ─────────────────────────────────────────────
   STAT BANNER
───────────────────────────────────────────── */
function StatBanner({ stats }) {
  const items = [
    { label: 'Total Trips',    value: stats.totalTrips   || 0,                             unit: 'trips',  icon: '📋' },
    { label: 'Avg Fuel Use',   value: fmt(stats.avgFuel),                                   unit: 'L/trip', icon: '⛽' },
    { label: 'Total Distance', value: fmt(stats.totalDistance, 0),                          unit: 'km',     icon: '🛣️' },
    { label: 'Avg Eco Score',  value: fmt(stats.avgEcoScore, 0),                            unit: '/100',   icon: '🌿' },
    { label: 'Total Cost',     value: stats.totalCost > 0 ? fmtCost(stats.totalCost) : '—', unit: '',       icon: '💰' },
  ];

  return (
    <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      {items.map(({ label, value, unit, icon }, i) => (
        <div key={label} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="input-label">{label}</span>
            <span style={{ fontSize: '1.1rem', opacity: 0.6 }}>{icon}</span>
          </div>
          <p className="stat-number" style={{ marginTop: '0.4rem', fontSize: '1.7rem' }}>{value}</p>
          {unit && (
            <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{unit}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Analytics() {
  const [trips, setTrips]           = useState([]);
  const [stats, setStats]           = useState({});
  const [driverTypes, setDriverTypes] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [tripsRes, statsRes] = await Promise.all([getTrips(), getTripStats()]);

        // getTrips may return { trips: [...] } or an array directly
        const tripsArray = tripsRes?.trips || tripsRes?.data?.trips || tripsRes?.data || [];
        setTrips(Array.isArray(tripsArray) ? tripsArray : []);

        // getTripStats may return { stats: {...}, driverTypes: [...] }
        // or the object directly depending on your API wrapper
        const statsObj      = statsRes?.stats      || statsRes?.data?.stats      || statsRes?.data || {};
        const driverTypesArr = statsRes?.driverTypes || statsRes?.data?.driverTypes || [];
        setStats(statsObj);
        setDriverTypes(Array.isArray(driverTypesArr) ? driverTypesArr : []);

      } catch (e) {
        console.error('Analytics load error:', e);
        setError(e.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await deleteTrip(id);
      setTrips(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      console.error('deleteTrip error:', err);
      alert('Failed to delete trip. Please try again.');
    }
  };

  return (
    <div className="page-enter" style={{ maxWidth: '1100px', margin: '0 auto', padding: '6rem 1.5rem 3rem' }}>

      {/* HEADER */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.68rem', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          DATA INTELLIGENCE
        </p>
        <h1 style={{ fontFamily: '"Cinzel",serif', fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-primary)', margin: 0 }}>
          Trip <span style={{ color: 'var(--accent-gold)' }}>Analytics</span>
        </h1>
        <div className="gold-divider" style={{ marginTop: '1.2rem', maxWidth: '160px' }} />
      </div>

      {/* LOADING */}
      {loading && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} rows={4} />)}
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="card p-6" style={{ textAlign: 'center' }}>
          <p style={{ color: '#e05252', fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.8rem' }}>⚠ {error}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Make sure the backend server is running.
          </p>
        </div>
      )}

      {/* CONTENT */}
      {!loading && !error && (
        <>
          <StatBanner stats={stats} />

          {trips.length > 0 ? (
            <>
              {/* Charts row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <FuelHistoryChart trips={trips} />
                <EcoScoreChart trips={trips} />
              </div>

              {/* Driver type breakdown */}
              {driverTypes.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <DriverTypePieChart driverTypes={driverTypes} />

                  <div className="card p-5">
                    <p className="section-title" style={{ marginBottom: '1rem' }}>Behaviour Breakdown</p>
                    <div className="gold-divider" style={{ marginBottom: '1rem' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {driverTypes.map(d => {
                        const pct = trips.length ? Math.round((d.count / trips.length) * 100) : 0;
                        const color = driverTypeColor(d._id);
                        return (
                          <div key={d._id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                              <span style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1rem', color: 'var(--text-secondary)' }}>{d._id}</span>
                              <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.72rem', color }}>
                                {d.count} ({pct}%)
                              </span>
                            </div>
                            <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 1s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Trip history table */}
              <div className="card p-5" style={{ overflowX: 'auto' }}>
                <p className="section-title" style={{ marginBottom: '1rem' }}>Trip History</p>
                <div className="gold-divider" style={{ marginBottom: '1rem' }} />
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {['Date', 'Speed', 'Distance', 'Actual', 'Predicted', 'Driver Type', 'Eco', ''].map(h => (
                        <th key={h} style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '0.6rem 0.8rem', textAlign: 'left' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((t, i) => (
                      <tr
                        key={t._id || i}
                        style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={tdStyle}>{fmtDate(t.createdAt)}</td>
                        <td style={tdStyle}>{t.speed ?? '—'} km/h</td>
                        <td style={tdStyle}>{t.distance ?? '—'} km</td>
                        <td style={tdStyle}>{fmtFuel(t.fuelUsed)}</td>
                        <td style={tdStyle}>{fmtFuel(t.predictedFuel)}</td>
                        <td style={tdStyle}>
                          <span style={{ color: driverTypeColor(t.driverType), fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.7rem' }}>
                            {t.driverType || '—'}
                          </span>
                        </td>
                        <td style={{
                          ...tdStyle,
                          color: t.ecoScore >= 70 ? '#4caf7d' : t.ecoScore >= 40 ? '#e8c060' : '#e05252',
                        }}>
                          {t.ecoScore ?? '—'}
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => handleDelete(t._id)}
                            style={{ background: 'transparent', border: 'none', color: '#e05252', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            🗑 Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="card p-10" style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: '"Cinzel",serif', fontSize: '1rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                NO TRIP DATA YET
              </p>
              <p style={{ fontFamily: '"Cormorant Garamond",serif', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Save a trip from the Dashboard or Planner to see analytics here.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const tdStyle = {
  fontFamily: '"Cormorant Garamond",serif',
  fontSize: '0.95rem',
  color: 'var(--text-secondary)',
  padding: '0.65rem 0.8rem',
};