// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  // 루트의 JS/JSX까지 모두 스캔 (src만 보지 말고)
  content: ['./index.html', './**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}

