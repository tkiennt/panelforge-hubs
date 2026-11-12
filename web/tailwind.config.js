/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Do not automatically trigger dark mode
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAF9F5',
          subtle: '#F3F1EC',
          sidebar: '#F3F1EC',
          hover: '#EBE8E1',
          card: '#FFFFFF',
        },
        sidebar: {
          DEFAULT: '#F3F1EC',
          hover: '#E8E5DD',
          border: '#E5E2DC',
        },
        ink: {
          DEFAULT: '#171717',
          muted: '#57534E',
          subtle: '#78716C',
        },
        hairline: {
          DEFAULT: '#E5E2DC',
          dark: '#D6D2CA',
        },
        accent: {
          DEFAULT: '#EA580C',
          hover: '#C2410C',
          light: '#FFF7ED',
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
        serif: ['"Source Serif 4"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
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
