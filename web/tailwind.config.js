/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Do not automatically trigger dark mode
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F1F5F9',
          subtle: '#F8FAFC',
          sidebar: '#F8FAFC',
          hover: '#E2E8F0',
          card: '#FFFFFF',
        },
        sidebar: {
          DEFAULT: '#F8FAFC',
          hover: '#EFF6FF',
          border: '#E2E8F0',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted: '#475569',
          subtle: '#64748B',
        },
        hairline: {
          DEFAULT: '#E2E8F0',
          dark: '#CBD5E1',
        },
        accent: {
          DEFAULT: '#0284C7',
          hover: '#0369A1',
          light: '#E0F2FE',
        },
        diff: {
          added: '#ECFDF5',
          addedBorder: '#A7F3D0',
          addedText: '#065F46',
          removed: '#FEF2F2',
          removedBorder: '#FECACA',
          removedText: '#991B1B',
          addBg: '#ECFDF5',
          addBorder: '#A7F3D0',
          addText: '#065F46',
          remBg: '#FEF2F2',
          remBorder: '#FECACA',
          remText: '#991B1B',
        },
      },
      fontFamily: {
        serif: ['"Lora"', '"Merriweather"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Be Vietnam Pro"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
    },
  },
  plugins: [],
};
