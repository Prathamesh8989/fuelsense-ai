/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light Mode
        cream: {
          50: '#fdfbf7',
        },
        'racing-green': '#064e3b',
        // Dark Mode
        'midnight-charcoal': {
          900: '#121212',
        },
        'soft-ivory': '#f8f6f2',
        // Shared Accent
        'brushed-gold': '#d4af37',
        // Glassmorphism complements
        glass: {
          light: 'rgba(253, 251, 247, 0.9)',
          dark: 'rgba(18, 18, 18, 0.85)',
        },
        border: {
          subtle: 'rgba(212, 175, 55, 0.15)',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Cinzel"', 'serif'],
        body: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(212,175,55,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(212,175,55,0.3)',
        'glass': '0 8px 32px rgba(0,0,0,0.12)',
        'glass-hover': '0 12px 40px rgba(0,0,0,0.15)',
        'deep': '0 20px 60px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};
