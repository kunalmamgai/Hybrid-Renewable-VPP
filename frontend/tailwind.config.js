/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // ── Operations console palette (warm dark corporate) ──
        // NOTE: key names retain their historical "cyan" suffixes for a safe
        // sweep; values are the warm bronze-amber corporate palette.
        'ops-void': '#0a0806',
        'ops-bg': '#0e0c09',
        'ops-surface': '#14110d',
        'ops-panel': '#191511',
        'ops-raised': '#221c15',
        'ops-line': 'rgba(224, 197, 160, 0.10)',
        'ops-line-strong': 'rgba(224, 197, 160, 0.18)',
        'ops-cyan': '#f59e0b',
        'ops-cyan-dim': '#92400e',
        'ops-green': '#34d399',
        'ops-green-dim': '#059669',
        'ops-amber': '#fbbf24',
        'ops-red': '#f87171',
        'ops-text': '#f3ede4',
        'ops-muted': 'rgba(243, 237, 228, 0.55)',
        'ops-faint': 'rgba(243, 237, 228, 0.35)',
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
        'ops': '0 1px 0 rgba(255,255,255,0.04) inset, 0 16px 40px rgba(0, 0, 0, 0.35)',
        'ops-lg': '0 1px 0 rgba(255,255,255,0.05) inset, 0 28px 64px rgba(0, 0, 0, 0.45)',
        'ops-cyan-glow': '0 0 18px rgba(217, 119, 6, 0.24), 0 0 2px rgba(217, 119, 6, 0.5)',
        'ops-green-glow': '0 0 18px rgba(52, 211, 153, 0.20), 0 0 2px rgba(52, 211, 153, 0.45)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'glass-lg': '0 20px 60px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06)',
        'glass-sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'emerald-glow': '0 0 20px rgba(16, 185, 129, 0.15)',
        'emerald-glow-sm': '0 0 10px rgba(16, 185, 129, 0.15)',
        'emerald-glow-lg': '0 0 40px rgba(16, 185, 129, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'flow': 'flow 2s ease-in-out infinite',
        'glassShimmer': 'glassShimmer 3s ease-in-out infinite',
        'status-pulse': 'statusPulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        statusPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.86)' },
        },
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
