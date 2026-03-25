/// <reference types="vitest" />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => ({
  plugins: [angular({ include: ['src/**/*.ts'] })],
  resolve: {
    alias: {
      'src': resolve(__dirname, 'src'),
      'netlify': resolve(__dirname, 'netlify'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['src/test-setup.ts'],
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/app/**/*.ts', 'netlify/functions/**/*.{ts,mts}'],
      exclude: [
        'src/app/**/*.spec.ts',
        'src/app/testing/**',
        'src/test-setup.ts',
      ],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
}));
