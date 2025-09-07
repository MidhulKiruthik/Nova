/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // Use '@tailwindcss/postcss' instead of 'tailwindcss'
    autoprefixer: {}, // Add autoprefixer for browser compatibility
  },
}

export default config