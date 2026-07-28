import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@kwe/contracts': resolve(import.meta.dirname, 'packages/contracts/src/index.ts'),
      '@kwe/schemas': resolve(import.meta.dirname, 'packages/schemas/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['apps/**/*.test.ts', 'packages/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
