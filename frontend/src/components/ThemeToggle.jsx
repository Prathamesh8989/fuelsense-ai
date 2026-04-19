import React from 'react';

export default function ThemeToggle({ theme, toggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        position: 'relative',
        width: '52px',
        height: '28px',
        borderRadius: '999px',
        background: isDark
          ? 'linear-gradient(135deg, #122d20, #225038)'
          : 'linear-gradient(135deg, #f2e9d0, #e4dccc)',
        border: '1px solid var(--border-bright)',
        cursor: 'pointer',
        transition: 'all 0.35s ease',
        flexShrink: 0,
        padding: 0,
      }}
    >
      {/* Track icons */}
      <span
        style={{
          position: 'absolute',
          left: '7px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '10px',
          opacity: isDark ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
      >
        🌙
      </span>
      <span
        style={{
          position: 'absolute',
          right: '7px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '10px',
          opacity: isDark ? 0 : 1,
          transition: 'opacity 0.3s',
        }}
      >
        ☀️
      </span>

      {/* Thumb */}
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: isDark ? '3px' : '25px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'var(--accent-gold)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          transition: 'left 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
    </button>
  );
}
