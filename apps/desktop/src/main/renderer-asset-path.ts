import { isAbsolute, relative, resolve } from 'node:path';

export function resolveRendererAsset(bundleRoot: string, requestUrl: string): string | null {
  const request = new URL(requestUrl);
  const rawPath = requestUrl.slice(requestUrl.indexOf(request.host) + request.host.length);

  if (request.protocol !== 'kwe:' || request.hostname !== 'renderer') {
    return null;
  }

  if (decodeURIComponent(rawPath).split('/').includes('..')) {
    return null;
  }

  const requestedPath = decodeURIComponent(request.pathname).replace(/^\/+/, '') || 'index.html';
  const assetPath = resolve(bundleRoot, requestedPath);
  const relativePath = relative(bundleRoot, assetPath);

  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    return null;
  }

  return assetPath;
}
