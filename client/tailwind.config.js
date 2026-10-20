/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        skribbl: {
          bg: '#14141e',
          card: '#1e1e2f',
          input: '#27273d',
          accent: '#4f46e5',
          accentHover: '#4338ca',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        comic: ['"Comic Sans MS"', '"Chalkboard SE"', 'cursive', 'sans-serif']
      }
    },
  },
  plugins: [],
}
