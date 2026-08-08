/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Marcellus', 'Sora', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        'vpp-cream': '#f8f0e2',
        // Core VPP Palette (Rajasthan DTE Govt Project)
        'vpp-emerald': '#059669',
        'vpp-emerald-light': '#10b981',
        'vpp-emerald-dark': '#065f46',
        'vpp-emerald-glow': 'rgba(16, 185, 129, 0.25)',
        'vpp-navy': '#0f172a',
        'vpp-navy-light': '#1e293b',
        'vpp-navy-muted': '#334155',
        'vpp-amber': '#f59e0b',
        'vpp-amber-light': '#fbbf24',
        'vpp-teal': '#14b8a6',
        'vpp-blue': '#3b82f6',
        'vpp-red': '#ef4444',
        
        // Unified Landing Theme (Sunset to Forest Green)
        'hero-sunset-orange': '#ff9f1c',
        'hero-sunset-peach': '#ffbf69',
        'hero-sunlight': '#fdf0d5',
        
        'desert-transition-dune': '#2d2317',
        'desert-transition-sand': '#7a5d3a',
        'desert-transition-tan': '#c8a676',
        'desert-transition-amber': '#d97706',
        
        'vpp-deep-forest': '#0f281e',
        'vpp-deep-night': '#0a0d0f',
        'vpp-deep-teal': '#0d1f1a',
        
        'vpp-accent-gold': '#d97706',
        'vpp-accent-orange': '#ff9f1c',
        'vpp-accent-teal': '#14b8a6',
        'saffron-400': '#F4A300',
        'saffron-300': '#FFB52E',
        // Frosted glass surfaces
        'glass': 'rgba(255, 255, 255, 0.72)',
        'glass-strong': 'rgba(255, 255, 255, 0.88)',
        'glass-subtle': 'rgba(255, 255, 255, 0.55)',
        'glass-dark': 'rgba(15, 23, 42, 0.75)',
        // Border colors
        'glass-border': 'rgba(255, 255, 255, 0.45)',
        'glass-border-strong': 'rgba(255, 255, 255, 0.65)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'glass-lg': '0 20px 60px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06)',
        'glass-sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'emerald-glow': '0 0 20px rgba(16, 185, 129, 0.15)',
        'emerald-glow-sm': '0 0 10px rgba(16, 185, 129, 0.15)',
        'emerald-glow-lg': '0 0 40px rgba(16, 185, 129, 0.2)',
        'saffron-glow': '0 0 20px rgba(244, 163, 0, 0.18)',
        'saffron-glow-sm': '0 0 10px rgba(244, 163, 0, 0.18)',
        'saffron-glow-lg': '0 0 40px rgba(244, 163, 0, 0.26)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'flow': 'flow 2s ease-in-out infinite',
        'glassShimmer': 'glassShimmer 3s ease-in-out infinite',
      },
      keyframes: {
        flow: {
          '0%': { opacity: '0.4' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.4' },
        },
        glassShimmer: {
          '0%, 100%': { opacity: '0.72' },
          '50%': { opacity: '0.82' },
        },
      },
    },
  },
  plugins: [],
};
