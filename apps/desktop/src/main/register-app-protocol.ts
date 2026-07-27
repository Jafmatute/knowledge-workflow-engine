import { access, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import { protocol } from 'electron';

import { resolveRendererAsset } from './renderer-asset-path.js';

export function registerApplicationScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'kwe',
      privileges: {
        secure: true,
        standard: true,
        supportFetchAPI: true,
      },
    },
  ]);
}

export function registerApplicationProtocol(): void {
  // Forge Vite plugin places the renderer output at .vite/renderer/<name>/.
  // With root set to src/renderer and base './', all assets are emitted
  // at the renderer output root without a nested source path.
  const rendererBundleRoot = join(__dirname, '..', 'renderer', MAIN_WINDOW_VITE_NAME);

  protocol.handle('kwe', async (request) => {
    const assetPath = resolveRendererAsset(rendererBundleRoot, request.url);

    if (assetPath === null) {
      return new Response('Not found', { status: 404 });
    }

    try {
      await access(assetPath);
      const contentType =
        extname(assetPath) === '.html'
          ? 'text/html; charset=utf-8'
          : extname(assetPath) === '.js'
            ? 'text/javascript; charset=utf-8'
            : extname(assetPath) === '.css'
              ? 'text/css; charset=utf-8'
              : 'application/octet-stream';
      return new Response(await readFile(assetPath), { headers: { 'content-type': contentType } });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}
