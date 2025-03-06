/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2D0A31", // roxo escuro
        secondary: "#FFD700", // amarelo
      },
    },
  },
  plugins: [],
}