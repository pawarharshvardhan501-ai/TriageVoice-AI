/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        esi1: {
          DEFAULT: '#DC2626', // Crimson Resuscitation
          light: '#FEE2E2',
          dark: '#991B1B',
          border: '#EF4444'
        },
        esi2: {
          DEFAULT: '#EA580C', // Emergent Orange
          light: '#FFEDD5',
          dark: '#9A3412',
          border: '#F97316'
        },
        esi3: {
          DEFAULT: '#D97706', // Urgent Amber
          light: '#FEF3C7',
          dark: '#92400E',
          border: '#FBBF24'
        },
        esi4: {
          DEFAULT: '#16A34A', // Less Urgent Green
          light: '#DCFCE7',
          dark: '#166534',
          border: '#22C55E'
        },
        esi5: {
          DEFAULT: '#2563EB', // Non-Urgent Blue
          light: '#DBEAFE',
          dark: '#1E40AF',
          border: '#3B82F6'
        },
        hospital: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          900: '#0C4A6E',
          950: '#082F49'
        }
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
