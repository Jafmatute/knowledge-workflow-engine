import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@kwe/contracts': resolve(import.meta.dirname, 'packages/contracts/src/index.ts'),
      '@kwe/schemas': resolve(import.meta.dirname, 'packages/schemas/src/index.ts'),
      '@kwe/domain': resolve(import.meta.dirname, 'packages/domain/src/index.ts'),
      '@kwe/application': resolve(import.meta.dirname, 'packages/application/src/index.ts'),
      '@kwe/infrastructure': resolve(import.meta.dirname, 'packages/infrastructure/src/index.ts'),
      react: resolve(import.meta.dirname, 'node_modules/react'),
      'react-dom': resolve(import.meta.dirname, 'node_modules/react-dom'),
      'react-dom/client': resolve(import.meta.dirname, 'node_modules/react-dom/client.js'),
      'react/jsx-runtime': resolve(import.meta.dirname, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': resolve(
        import.meta.dirname,
        'node_modules/react/jsx-dev-runtime.js',
      ),
    },
  },
  plugins: [react()],
  test: {
    environment: 'node',
    include: [
      'apps/**/*.test.ts',
      'apps/**/*.test.tsx',
      'packages/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
  },
});
