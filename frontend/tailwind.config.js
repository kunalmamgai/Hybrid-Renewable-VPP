/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        'vpp-blue': '#1976d2',
        'vpp-green': '#388e3c',
        'vpp-amber': '#ff9800',
        'vpp-red': '#d32f2f',
        'vpp-teal': '#00897b',
        'grid-100': '#f5f7fa',
        'grid-200': '#e4e7eb',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'flow': 'flow 2s ease-in-out infinite',
      },
      keyframes: {
        flow: {
          '0%': { opacity: '0.4' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
};
