/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          green: '#00ff41',
          red: '#ff0033',
          amber: '#ffaa00',
          cyan: '#00e5ff',
          bg: '#000000',
          surface: '#0a0a0a',
          card: '#0d0d0d',
          border: '#1a1a1a',
          'border-light': '#2a2a2a',
          muted: '#555555',
          dim: '#888888',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
