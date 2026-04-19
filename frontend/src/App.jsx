import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { PageLoader } from './components/Loader';
import { useTheme } from './hooks/useTheme';

// Lazy load pages
const Home      = React.lazy(() => import('./pages/Home'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Planner = React.lazy(() => import('./pages/Planner'));
const Vehicle = React.lazy(() => import('./pages/Vehicle'));

/* ── Decorative background pattern ── */
function BackgroundDecor() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Radial glow top-right */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,153,58,0.06) 0%, transparent 70%)',
      }} />
      {/* Radial glow bottom-left */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '-10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(76,175,125,0.04) 0%, transparent 70%)',
      }} />
      {/* Subtle grid lines */}
      <svg
        width="100%"
        height="100%"
        style={{ opacity: 0.03 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="var(--accent-gold)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

export default function App() {
  const { theme, toggle } = useTheme();

  return (
    <Router>
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <BackgroundDecor />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Navbar theme={theme} toggleTheme={toggle} />

          <main>
            <Suspense fallback={<PageLoader text="Loading module..." />}>
              <Routes>
                <Route path="/"          element={<Home />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/vehicle" element={<Vehicle />} />

      </Routes>
            </Suspense>
          </main>

          {/* Footer */}
          <footer style={{
            borderTop: '1px solid var(--border-color)',
            padding: '1.5rem',
            textAlign: 'center',
            marginTop: '3rem',
          }}>
            <p style={{
              fontFamily: '"IBM Plex Mono",monospace',
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              color: 'var(--text-muted)',
            }}>
              FUELSENSE AI · INTELLIGENT FUEL OPTIMISATION · POWERED BY ML
            </p>
          </footer>
        </div>
      </div>
    </Router>
  );
}
