import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class', // ✅ enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
        heading: ['var(--font-poppins)', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'bounce-slow': 'bounce 3s infinite',
        'loading-bar': 'loadingBar 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        loadingBar: {
          '0%':   { transform: 'translateX(-100%) scaleX(0.5)' },
          '50%':  { transform: 'translateX(0%)   scaleX(0.8)' },
          '100%': { transform: 'translateX(100%) scaleX(0.5)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
