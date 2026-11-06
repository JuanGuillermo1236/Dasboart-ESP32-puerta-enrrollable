import preact from '@preact/preset-vite';
import { defineConfig } from 'vitest/config';

// En desarrollo, la API y el WebSocket los atiende el backend (npm start o npm run simular en backend/).
export default defineConfig({
  plugins: [preact()],
  build: { target: 'es2020' },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/ws': { target: 'ws://localhost:3000', ws: true },
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
