/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        earth: '#5D4037',
        turmeric: '#FFB300',
        herbal: '#2E7D32',
        sand: '#FFF8E1',
        clay: '#D7CCC8',
      },
    },
  },
  plugins: [],
}
