import type { Config } from 'tailwindcss'
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      colors: {
        brand: { DEFAULT: '#00E5A0', dim: 'rgba(0,229,160,0.12)', muted: 'rgba(0,229,160,0.06)' },
        bg: { 0: '#080A0D', 1: '#0D1017', 2: '#131820', 3: '#1A2030', 4: '#222A3A' },
        border: { DEFAULT: 'rgba(255,255,255,0.07)', strong: 'rgba(255,255,255,0.13)' },
      },
      animation: {
        'ticker': 'ticker 40s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.2s ease forwards',
        'slideUp': 'slideUp 0.25s ease forwards',
      },
      keyframes: {
        ticker: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}
export default config
