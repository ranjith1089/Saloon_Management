/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Marketing-side palette — used by /public/* pages
        brand: {
          50:  '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          900: '#7F1D1D',
        },
        cream:    '#FFF9F5',
        charcoal: '#111214',
        sage:     '#6B8E7F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 8px 24px -8px rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.04)',
        pop:  '0 24px 60px -12px rgba(220,38,38,0.25)',
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(60% 60% at 50% 0%, rgba(220,38,38,0.10) 0%, transparent 70%)',
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
    },
  },
  plugins: [],
};
