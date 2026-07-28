import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: 'preload.cjs',
      },
    },
  },
  resolve: {
    alias: {
      '@kwe/contracts': resolve(import.meta.dirname, '../../packages/contracts/src/index.ts'),
      '@kwe/schemas': resolve(import.meta.dirname, '../../packages/schemas/src/index.ts'),
    },
  },
});
