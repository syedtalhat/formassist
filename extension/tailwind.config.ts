import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{html,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette from DESIGN.md
        primary: {
          DEFAULT: '#004149',
          container: '#0E5A64', // Lagoon primary anchor
          pressed: '#0A4249',
          tint: '#E3F0F1',
          on: '#FFFFFF',
          'on-container': '#8FCFDB',
        },
        secondary: {
          DEFAULT: '#52606A',
          container: '#D5E5F1',
          on: '#FFFFFF',
          'on-container': '#586671',
        },
        tertiary: {
          DEFAULT: '#533400',
          container: '#724900',
          on: '#FFFFFF',
          'on-container': '#FFB74F',
        },
        text: {
          primary: '#1F2D36', // Slate Ink
          secondary: '#4A5B66',
          disabled: '#8A98A1',
          'on-primary': '#FFFFFF',
        },
        surface: {
          page: '#F3F6F7', // Neutral Mist
          card: '#FFFFFF', // Paper white
          muted: '#ECEFF1',
          dim: '#D7DADB',
          container: '#EBEEEF',
        },
        border: {
          strong: '#6B7B85',
          subtle: '#DDE4E8',
        },
        accent: {
          wash: 'rgba(242, 169, 59, 0.30)',
          marigold: '#F2A93B',
        },
        // Provenance colors
        source: {
          official: '#17724A',
          'official-bg': '#E4F4EC',
          page: '#2A5DA8',
          'page-bg': '#E6EEFA',
          ai: '#5E479B',
          'ai-bg': '#EFEBFA',
        },
        // Tag colors
        tag: {
          required: '#0E5A64',
          'required-bg': '#E3F0F1',
          optional: '#4A5B66',
          'optional-bg': '#ECEFF1',
          unusual: '#8F4200',
          'unusual-bg': '#FFEBD5',
        },
        danger: {
          DEFAULT: '#B3261E',
          bg: '#FDECEA',
        },
      },
      fontFamily: {
        display: ['"Baloo 2"', 'sans-serif'],
        body: ['"Mukta"', 'sans-serif'],
      },
      borderRadius: {
        control: '12px',
        card: '16px',
        panel: '20px',
        pill: '9999px',
      },
      boxShadow: {
        float: '0 1px 2px rgba(31, 45, 54, 0.18), 0 8px 24px rgba(14, 90, 100, 0.18)',
        panel: '-8px 0 32px rgba(14, 90, 100, 0.20), -1px 0 0 #CBD5DB',
        alert: '0 12px 32px rgba(179, 38, 30, 0.18), 0 1px 2px rgba(31, 45, 54, 0.18)',
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '0.75rem',
        'space-lg': '1rem',
        'space-xl': '1.25rem',
        'space-2xl': '1.5rem',
        'space-3xl': '2rem',
        gutter: '1rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
