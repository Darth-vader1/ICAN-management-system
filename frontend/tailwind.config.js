/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Sidebar palette
        sidebar: {
          DEFAULT: '#0f172a',
          hover: '#1e293b',
          active: '#1e3a5f',
          muted: '#64748b',
          divider: '#1e293b',
        },
        // Brand accent
        accent: {
          DEFAULT: '#3b82f6',
          teal: '#10b981',
          light: '#60a5fa',
        },
        // Surfaces
        surface: {
          DEFAULT: '#f0f2f5',
          card: '#ffffff',
        },
        // Navy tones (for progress bars, chart bars)
        navy: {
          DEFAULT: '#1e3a5f',
          light: '#2d4a6f',
          dark: '#162d4a',
        },
        // Primary (overriding)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'sidebar': '2px 0 8px rgba(0, 0, 0, 0.15)',
      },
      fontSize: {
        'stat': ['1.75rem', { lineHeight: '2rem', fontWeight: '700' }],
        'stat-lg': ['2rem', { lineHeight: '2.25rem', fontWeight: '700' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
