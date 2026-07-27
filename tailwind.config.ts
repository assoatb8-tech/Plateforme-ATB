import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E02424',
          dark: '#B91C1C',
          light: '#FCA5A5',
        },
        accent: {
          DEFAULT: '#F97316',
          dark: '#C2410C',
          light: '#FDBA74',
        },
        secondary: {
          DEFAULT: '#D1AC63',
          dark: '#A9863F',
          light: '#E6D3A8',
        },
        success: '#16A34A',
        error: '#DC2626',
        warning: '#F59E0B',
        surface: '#FFFFFF',
        background: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['"Noto Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [],
} satisfies Config
