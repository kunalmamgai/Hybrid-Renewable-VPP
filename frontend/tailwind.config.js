/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Landing-page-inspired palette
        'vpp-emerald': '#059669',
        'vpp-emerald-light': '#10b981',
        'vpp-emerald-dark': '#065f46',
        'vpp-emerald-glow': 'rgba(16, 185, 129, 0.25)',
        'vpp-navy': '#0f172a',
        'vpp-navy-light': '#1e293b',
        'vpp-navy-muted': '#334155',
        'vpp-amber': '#f59e0b',
        'vpp-amber-light': '#fbbf24',
        'vpp-red': '#ef4444',
        'vpp-teal': '#14b8a6',
        'vpp-blue': '#3b82f6',
        // Hero-inspired palette
        'hero-green-deep': '#0f281e',
        'hero-green-vibrant': '#2d6a4f',
        'hero-sunset-orange': '#ff9f1c',
        'hero-sunset-peach': '#ffbf69',
        'hero-sky-teal': '#76c7b7',
        'hero-sunlight': '#fdf0d5',
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
        'emerald-glow-lg': '0 0 40px rgba(16, 185, 129, 0.2)',
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
