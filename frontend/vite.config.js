// ════════════════════════════════════════════════════════════════
// FILE: vite.config.js
// PURPOSE: Vite build configuration for AstraAgent frontend.
//          Registers React and Tailwind CSS v4 plugins, and
//          configures the '@' path alias to resolve to src/.
// ════════════════════════════════════════════════════════════════

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
