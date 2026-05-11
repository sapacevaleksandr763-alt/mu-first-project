import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8fafc',
          100: '#eff6ff',
          200: '#dbeafe',
          300: '#bfdbfe',
          400: '#93c5fd',
          500: '#60a5fa',
          600: '#3b82f6',
          700: '#2563eb',
          800: '#1d4ed8',
          900: '#1e40af'
        },
        soft: '#f7f3ff'
      },
      boxShadow: {
        soft: '0 16px 40px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
