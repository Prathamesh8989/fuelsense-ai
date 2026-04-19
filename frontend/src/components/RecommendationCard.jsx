import React from 'react';
import { driverTypeColor } from '../utils/helpers';

const iconMap = {
  speed:       '⚡',
  accelerat:   '🚀',
  idle:        '⏸️',
  excellent:   '✅',
  default:     '💡',
};

function getIcon(text) {
  const lower = text.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lower.includes(key)) return icon;
  }
  return iconMap.default;
}

export default function RecommendationCard({ recommendations = [], driverType, confidenceScore }) {
  return (
    <div className="card p-5 animate-slide-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
        <div>
          <p className="section-title" style={{ marginBottom: '0.3rem' }}>AI Recommendations</p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Personalised insights from your driving data
          </p>
        </div>

        {/* Driver type badge */}
        {driverType && (
          <span
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              border: `1px solid ${driverTypeColor(driverType)}40`,
              background: `${driverTypeColor(driverType)}12`,
              color: driverTypeColor(driverType),
              whiteSpace: 'nowrap',
            }}
          >
            {driverType}
          </span>
        )}
      </div>

      <div className="gold-divider" style={{ marginBottom: '1.2rem' }} />

      {/* Confidence row */}
      {confidenceScore !== undefined && (
        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              MODEL CONFIDENCE
            </span>
            <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.9rem', color: 'var(--accent-gold)' }}>
              {(confidenceScore * 100).toFixed(1)}%
            </span>
          </div>
          <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${confidenceScore * 100}%`,
                background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-gold-light))',
                borderRadius: '2px',
                transition: 'width 1s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Recommendations list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {recommendations.map((rec, i) => (
          <div
            key={i}
            className="animate-slide-up"
            style={{
              animationDelay: `${i * 80}ms`,
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
              padding: '0.85rem',
              background: 'var(--bg-glass)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}>{getIcon(rec)}</span>
            <p
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {rec}
            </p>
          </div>
        ))}

        {recommendations.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontFamily: '"Cormorant Garamond", serif', textAlign: 'center', padding: '1rem' }}>
            Submit a trip to receive AI recommendations.
          </p>
        )}
      </div>
    </div>
  );
}
