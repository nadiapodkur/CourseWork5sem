import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward API calls to the Node server; keep the Host header so subdomains resolve tenants.
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: false },
      '/health': { target: 'http://localhost:4000' },
    },
  },
});
