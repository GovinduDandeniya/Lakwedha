/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0D5C3E',
        secondary: '#D4AF37',
        accent: '#28A745',
        emergency: '#DC3545',
        background: '#F8F9FA',
      },
    },
  },
  plugins: [],
}
