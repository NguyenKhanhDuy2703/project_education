import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), !process.env.VITEST ? tailwindcss() : null].filter(Boolean) as any,
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        app: path.resolve(import.meta.dirname, 'index.html'),
        sqlBenchmark: path.resolve(import.meta.dirname, 'sql-benchmark.html'),
      },
    },
  },
  // @ts-expect-error vitest config
  test: {
    environment: 'happy-dom',
    globals: true,
    testTimeout: 35000,
    hookTimeout: 35000,
  },
})


