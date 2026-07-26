import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const developmentCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self' ws://localhost:* http://localhost:*",
  "font-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
].join('; ');

const productionCsp = [
  "default-src 'self' kwe:",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self' kwe:",
  "font-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
].join('; ');

export default defineConfig(({ mode }) => ({
  build: {
    rollupOptions: {
      input: resolve(import.meta.dirname, 'src/renderer/index.html'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'kwe-content-security-policy',
      transformIndexHtml(html) {
        return html.replace('%KWE_CSP%', mode === 'development' ? developmentCsp : productionCsp);
      },
    },
  ],
  resolve: {
    alias: {
      '@kwe/contracts': resolve(import.meta.dirname, '../../packages/contracts/src/index.ts'),
      '@kwe/schemas': resolve(import.meta.dirname, '../../packages/schemas/src/index.ts'),
    },
  },
}));
