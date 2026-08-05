/** @type {import('tailwindcss').Config} */
// NOTE: Tailwind v4 reads the theme from the @theme block in src/index.css,
// not from this file (no @config directive is used). Kept here only so it
// doesn't contradict the real palette -- edit src/index.css to change colours.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // chrome: header, banners, footers, dark surfaces
        brand: {
          50: '#f2f6f8', 100: '#e1ecef', 200: '#c1d9e1', 300: '#95c1d0',
          400: '#60a7be', 500: '#3a849c', 600: '#2d687c', 700: '#275c6d',
          800: '#22505f', 900: '#193c48',
        },
        // action: buttons, links, highlights, active states
        accent: {
          50: '#fef8f0', 100: '#feefdd', 200: '#fdddb4', 300: '#fdc781',
          400: '#fda93f', 500: '#ff950f', 600: '#ea8300', 700: '#c26c00',
          800: '#9e5900', 900: '#7d4703',
        },
      },
    },
  },
  plugins: [],
}
