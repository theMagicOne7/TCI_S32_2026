import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/login': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
      '/usuarios': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});