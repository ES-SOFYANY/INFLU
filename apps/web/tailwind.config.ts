import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0A0F',
          base: '#0A0A0F',
          elevated: '#11141B',
          surface: '#161A23',
          subtle: '#11141B',
          card: '#161A23',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.10)',
          subtle: 'rgba(255,255,255,0.06)',
          strong: 'rgba(255,255,255,0.16)',
          accent: 'rgba(124,92,255,0.45)',
          focus: '#7C5CFF',
        },
        text: {
          DEFAULT: '#ECECF2',
          primary: '#ECECF2',
          secondary: '#A1A6B5',
          muted: '#6B7280',
          disabled: '#4B5563',
          inverse: '#0A0A0F',
        },
        brand: {
          50: '#F2EEFF',
          100: '#E5DCFF',
          400: '#A78BFA',
          500: '#7C5CFF',
          600: '#6B4DEB',
          700: '#5B3FE8',
        },
        accent: {
          400: '#5BA8FF',
          500: '#2D8CFF',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#38BDF8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        arabic: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.5)',
        elevated: '0 12px 48px rgba(0,0,0,0.7)',
        modal: '0 24px 64px rgba(0,0,0,0.8)',
        glow: '0 0 24px rgba(124,92,255,0.35)',
        'glow-hover': '0 0 48px rgba(124,92,255,0.55)',
      },
      backdropBlur: {
        glass: '10px',
      },
    },
  },
  plugins: [forms, typography],
} satisfies Config;
