import { isAbsolute, relative, resolve } from 'node:path';

export function resolveRendererAsset(bundleRoot: string, requestUrl: string): string | null {
  try {
    const request = new URL(requestUrl);

    if (
      request.protocol !== 'kwe:' ||
      request.hostname !== 'renderer' ||
      request.username !== '' ||
      request.password !== '' ||
      request.search !== '' ||
      request.hash !== ''
    ) {
      return null;
    }

    const rawPath = requestUrl.slice(requestUrl.indexOf(request.host) + request.host.length);
    const decodedRawPath = decodeURIComponent(rawPath);

    if (decodedRawPath.split('/').includes('..')) {
      return null;
    }

    const requestedPath = decodeURIComponent(request.pathname).replace(/^\/+/, '') || 'index.html';
    const assetPath = resolve(bundleRoot, requestedPath);
    const relativePath = relative(bundleRoot, assetPath);

    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      return null;
    }

    return assetPath;
  } catch {
    return null;
  }
}
