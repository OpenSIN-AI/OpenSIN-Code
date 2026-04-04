import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [path.resolve(__dirname, 'setup.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['../src/**/*.ts'],
      exclude: ['../src/**/*.d.ts', '../src/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      'bun:bundle': path.resolve(__dirname, 'mocks/bun-bundle.ts'),
      'ignore': path.resolve(__dirname, 'mocks/ignore.ts'),
    },
  },
});
