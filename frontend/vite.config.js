import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // During development, send every /api request to the backend on port 3000.
    // This way the browser only talks to one address and we avoid CORS problems.
    proxy: {
      '/api': process.env.BACKEND_URL || 'http://localhost:3000'
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/setupTests.js', 'src/**/*.test.{js,jsx}']
    }
  }
});
