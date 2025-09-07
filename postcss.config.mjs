/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {}, // Use 'tailwindcss' directly
    autoprefixer: {}, // Add autoprefixer for browser compatibility
  },
}

export default config