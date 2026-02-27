/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0a',
        paper: '#ffffff',
        neon: '#10b981',
        'neon-dark': '#059669',
        secondary: '#8b5cf6',
      },
      fontFamily: {
        sans: ['"Orbitron"', 'sans-serif'],
        serif: ['"Noto Serif SC"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'dragon-scales': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20 L40 0 L20 -20 L0 0 Z' fill='%2310b981' fill-opacity='0.1' stroke='%23059669' stroke-width='0.5' stroke-opacity='0.2'/%3E%3C/svg%3E\")",
      },
      animation: {
        'spin-slow': 'spin 10s linear infinite',
      }
    },
  },
  plugins: [],
}
