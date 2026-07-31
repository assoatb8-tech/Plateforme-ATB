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
      keyframes: {
        marquee: {
          // Starts shifted left by one full copy of the (duplicated) track
          // and animates back to 0 — reads as motion toward the right,
          // matching the requested left-to-right direction. Track renders
          // its content twice in a row (see SponsorMarquee), so exactly
          // -50% is one full copy and the loop point is seamless.
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
