import preact from '@preact/preset-vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ command }) => ({
  plugins: [preact()],
  define: { __MOCK__: JSON.stringify(command === 'serve') },
  build: { target: 'es2020', assetsInlineLimit: 0 },
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/ws': { target: 'ws://localhost:8787', ws: true },
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
}));
