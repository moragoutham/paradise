/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // ── Color Palette ────────────────────────────────────────────────────
      colors: {
        // Brand: indigo → violet gradient feel
        brand: {
          50:  'hsl(245, 100%, 97%)',
          100: 'hsl(245, 100%, 93%)',
          200: 'hsl(246, 96%, 87%)',
          300: 'hsl(247, 93%, 78%)',
          400: 'hsl(249, 88%, 68%)',
          500: 'hsl(252, 82%, 60%)',  // primary
          600: 'hsl(254, 75%, 54%)',
          700: 'hsl(255, 71%, 46%)',
          800: 'hsl(256, 67%, 39%)',
          900: 'hsl(258, 63%, 32%)',
          950: 'hsl(260, 60%, 20%)',
        },
        // Accent: cyan/teal for highlights
        accent: {
          50:  'hsl(192, 100%, 95%)',
          100: 'hsl(192, 97%, 87%)',
          200: 'hsl(193, 94%, 73%)',
          300: 'hsl(194, 91%, 59%)',
          400: 'hsl(195, 88%, 49%)',
          500: 'hsl(196, 90%, 42%)',
          600: 'hsl(197, 88%, 36%)',
        },
        // Surface: dark mode card/panel colors
        surface: {
          50:  'hsl(220, 20%, 98%)',
          100: 'hsl(220, 14%, 96%)',
          200: 'hsl(220, 13%, 91%)',
          // Dark surfaces
          800: 'hsl(224, 15%, 12%)',
          850: 'hsl(224, 17%, 10%)',
          900: 'hsl(224, 20%, 8%)',
          950: 'hsl(224, 24%, 5%)',
        },
      },
      // ── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      // ── Shadows ──────────────────────────────────────────────────────────
      boxShadow: {
        'glow-brand': '0 0 20px -5px hsl(252, 82%, 60%, 0.4)',
        'glow-accent': '0 0 20px -5px hsl(196, 90%, 42%, 0.35)',
        'card-sm': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'card-lg': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'card-dark': '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
      },
      // ── Border Radius ────────────────────────────────────────────────────
      borderRadius: {
        '4xl': '2rem',
      },
      // ── Animations ───────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(252, 82%, 60%, 0)' },
          '50%': { boxShadow: '0 0 0 8px hsl(252, 82%, 60%, 0.15)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-up': 'fade-up 0.3s ease-out',
        'fade-down': 'fade-down 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'shimmer': 'shimmer 1.8s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
      // ── Backdrop blur ────────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },
      // ── Spacing ──────────────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      // ── Sidebar width ────────────────────────────────────────────────────
      width: {
        sidebar: '16rem',       // 256px expanded
        'sidebar-collapsed': '4.5rem', // 72px collapsed (icons only)
      },
    },
  },
  plugins: [],
}
