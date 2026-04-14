import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [path.resolve(__dirname, 'setup')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['../src/**/*'],
      exclude: ['../src/**/*.d', '../src/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      'bun:bundle': path.resolve(__dirname, 'mocks/bun-bundle'),
      'ignore': path.resolve(__dirname, 'mocks/ignore'),
    },
  },
});
