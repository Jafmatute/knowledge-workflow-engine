import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { net, protocol } from 'electron';

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
  const rendererBundleRoot = join(__dirname, '..', 'renderer', MAIN_WINDOW_VITE_NAME);

  protocol.handle('kwe', async (request) => {
    const assetPath = resolveRendererAsset(rendererBundleRoot, request.url);

    if (assetPath === null) {
      return new Response('Not found', { status: 404 });
    }

    try {
      await access(assetPath);
      return net.fetch(pathToFileURL(assetPath).toString());
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}
