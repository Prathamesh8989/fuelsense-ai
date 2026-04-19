import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { path: '/',          label: 'Dashboard' },
  { path: '/analytics', label: 'Analytics'  },
  { path: '/planner', label: 'Planner' },
  { path: '/vehicle', label: 'Vehicle' },
];

export default function Navbar({ theme, toggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [location]);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled
          ? 'var(--bg-card)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-color)' : '1px solid transparent',
        transition: 'all 0.35s ease',
        padding: '0 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}
      >
        {/* Logo */}
        <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Logo mark */}
          <svg width="32" height="32" viewBox="0 0 32 32">
            <polygon
              points="16,2 30,28 2,28"
              fill="none"
              stroke="var(--accent-gold)"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <polygon
              points="16,8 26,26 6,26"
              fill="none"
              stroke="var(--accent-gold)"
              strokeWidth="1"
              opacity="0.7"
            />
            <circle cx="16" cy="22" r="4" fill="var(--accent-gold)" />
          </svg>

          <div>
            <div style={{
              fontFamily: '"Cinzel", serif',
              fontSize: '1rem',
              letterSpacing: '0.18em',
              color: 'var(--accent-gold)',
              fontWeight: 700,
              lineHeight: 1.1,
            }}>
              FUELSENSE
            </div>
            <div style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.55rem',
              letterSpacing: '0.22em',
              color: 'var(--text-muted)',
            }}>
              AI OPTIMIZER
            </div>
          </div>
        </NavLink>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="hidden md:flex">
          {navItems.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              style={({ isActive }) => ({
                fontFamily: '"Cinzel", serif',
                fontSize: '0.72rem',
                letterSpacing: '0.14em',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                borderBottom: isActive ? '1px solid var(--accent-gold)' : '1px solid transparent',
                paddingBottom: '2px',
                transition: 'color 0.2s, border-color 0.2s',
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle theme={theme} toggle={toggleTheme} />

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent-gold)',
              fontSize: '1.3rem',
              padding: '4px',
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid var(--border-color)',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {navItems.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              style={({ isActive }) => ({
                fontFamily: '"Cinzel", serif',
                fontSize: '0.85rem',
                letterSpacing: '0.14em',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
