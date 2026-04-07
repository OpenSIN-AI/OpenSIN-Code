import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.ts', 'packages/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/missing/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'packages/opensin-sdk/src/**/*.ts',
        'packages/opensin-cli/src/**/*.ts',
        'packages/cli-tools/src/**/*.ts',
        'packages/plugin-sdk/src/**/*.ts',
        'packages/plugin-runtime/src/**/*.ts',
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/missing/**',
      ],
      thresholds: {
        branches: 70,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    setupFiles: ['<rootDir>/tests/setup.ts'],
  },
});
