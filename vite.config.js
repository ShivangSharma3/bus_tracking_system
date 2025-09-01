import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    sourcemap: false,
    minify: mode === 'production',
    rollupOptions: {
      onwarn: (warning, warn) => {
        // Suppress certain warnings during build
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
        warn(warning)
      }
    }
  }
}))
