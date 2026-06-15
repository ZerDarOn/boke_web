/** @type {import('tailwindcss').Config} */
export default {
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
        // 主题色：引用 CSS 变量(HSL 通道)，支持 /透明度 修饰符，随主题栏实时变化
        neon: 'hsl(var(--color-neon-hsl) / <alpha-value>)',
        'neon-dark': 'hsl(var(--color-neon-dark-hsl) / <alpha-value>)',
        secondary: 'hsl(var(--color-secondary-hsl) / <alpha-value>)',
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
};
