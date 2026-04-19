import React from 'react';

export default function Loader({ text = 'Analysing...', size = 'md' }) {
  const sizes = { sm: 28, md: 44, lg: 64 };
  const r = sizes[size] / 2;
  const strokeW = size === 'sm' ? 2 : 3;
  const circumference = 2 * Math.PI * (r - strokeW * 2);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={sizes[size]}
        height={sizes[size]}
        viewBox={`0 0 ${sizes[size]} ${sizes[size]}`}
        style={{ animation: 'spin 1.2s linear infinite' }}
      >
        {/* Track */}
        <circle
          cx={r}
          cy={r}
          r={r - strokeW * 2}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={strokeW}
        />
        {/* Spinner arc */}
        <circle
          cx={r}
          cy={r}
          r={r - strokeW * 2}
          fill="none"
          stroke="var(--accent-gold)"
          strokeWidth={strokeW}
          strokeDasharray={`${circumference * 0.3} ${circumference * 0.7}`}
          strokeLinecap="round"
        />
      </svg>
      {text && (
        <p
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          {text}
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}

/** Full-page loader overlay */
export function PageLoader({ text }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        zIndex: 9999,
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Animated logo mark */}
      <svg width="60" height="60" viewBox="0 0 60 60" className="animate-float">
        <polygon
          points="30,4 56,46 4,46"
          fill="none"
          stroke="var(--accent-gold)"
          strokeWidth="1.5"
          opacity="0.3"
        />
        <polygon
          points="30,12 50,44 10,44"
          fill="none"
          stroke="var(--accent-gold)"
          strokeWidth="1"
          opacity="0.6"
        />
        <circle cx="30" cy="34" r="6" fill="var(--accent-gold)" opacity="0.9" />
      </svg>

      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontFamily: '"Cinzel", serif',
            fontSize: '1.2rem',
            letterSpacing: '0.2em',
            color: 'var(--accent-gold)',
          }}
        >
          FUELSENSE AI
        </p>
        <p
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            marginTop: '0.5rem',
            letterSpacing: '0.1em',
          }}
        >
          {text || 'Initialising systems...'}
        </p>
      </div>
    </div>
  );
}

/** Skeleton placeholder */
export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="card p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: i === 0 ? '20px' : '14px', width: i === 0 ? '60%' : `${70 + i * 10}%` }}
        />
      ))}
    </div>
  );
}
