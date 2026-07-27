import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: 'hash-worker.cjs',
      },
    },
  },
  resolve: {
    alias: {
      '@kwe/schemas': resolve(import.meta.dirname, '../../packages/schemas/src/index.ts'),
    },
  },
});
