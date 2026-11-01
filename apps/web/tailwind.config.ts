import type { Config } from 'tailwindcss';

/**
 * Tailwind theme mapped 1:1 onto the design tokens in src/styles/tokens.css.
 * Mirror of apps/mobile/tailwind.config.js — same names, same values.
 *
 * Rule: never put a raw hex value in a className. Add it here, or use a token.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // Preflight is OFF on purpose: globals.css already has a reset, and Tailwind's
  // preflight would re-style the art-directed start/loading screens that are
  // already verified. Turn it on only if you migrate those screens too.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        void: '#0B0618',
        space: '#150A2E',
        deep: '#1E1038',
        panel: '#241543',
        'panel-2': '#2D1A52',
        line: '#3D2A6B',

        gold: '#FBBF24',
        'gold-2': '#F59E0B',
        'gold-dark': '#B07D06',
        'gold-soft': '#FDE68A',

        violet: '#8B5CF6',
        'violet-2': '#6D28D9',
        magenta: '#D946EF',
        pink: '#EC4899',

        text: '#F5F0FF',
        'text-muted': '#A99BC9',
        'text-dim': '#7B6B9E',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '24px',
        6: '32px',
        7: '48px',
        8: '64px',
      },
      borderRadius: {
        sm: '10px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 18px 44px rgba(0, 0, 0, 0.5)',
        float: '0 24px 60px rgba(0, 0, 0, 0.55)',
        'glow-violet': '0 0 60px rgba(139, 92, 246, 0.45)',
        'glow-gold': '0 0 34px rgba(251, 191, 36, 0.45)',
      },
      fontFamily: {
        display: ['Baloo 2', 'Fredoka', 'Trebuchet MS', 'system-ui', 'sans-serif'],
        body: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        micro: '0.66rem',
        label: '0.72rem',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        fast: '160ms',
        med: '320ms',
        slow: '700ms',
      },
    },
  },
  plugins: [],
};

export default config;
