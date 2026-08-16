// ════════════════════════════════════════════════════════════════
// FILE: postcss.config.js
// PURPOSE: PostCSS configuration for Vite. Registers tailwindcss
//          and autoprefixer plugins.
// ════════════════════════════════════════════════════════════════
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}

