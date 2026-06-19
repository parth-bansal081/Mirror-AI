import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../bundle',
    emptyOutDir: false,
    rollupOptions: {
      external: ['/static/anna-apps/_sdk/latest/index.js'],
      output: {
        // Single bundle — no code splitting (required for Anna static file serving)
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
    // Increase chunk size warning limit — we're intentionally bundling everything
    chunkSizeWarningLimit: 3000,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/static': {
        target: 'http://localhost:5180',
        changeOrigin: true,
      },
    },
  },
});
