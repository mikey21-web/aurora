import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@gitroom/nestjs-libraries': path.resolve(__dirname, 'libraries/nestjs-libraries/src'),
      '@gitroom/helpers': path.resolve(__dirname, 'libraries/helpers/src'),
      '@gitroom/backend': path.resolve(__dirname, 'apps/backend/src'),
    },
  },
});
