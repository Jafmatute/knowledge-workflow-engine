import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveRendererAsset } from './renderer-asset-path.js';

describe('renderer asset path resolution', () => {
  const bundleRoot = join('C:', 'kwe', 'renderer');

  it('resolves an application asset inside the renderer bundle', () => {
    expect(resolveRendererAsset(bundleRoot, 'kwe://renderer/assets/app.js')).toBe(
      join(bundleRoot, 'assets', 'app.js'),
    );
  });

  it('rejects path traversal and other protocol hosts', () => {
    expect(resolveRendererAsset(bundleRoot, 'kwe://renderer/../../secret.txt')).toBeNull();
    expect(resolveRendererAsset(bundleRoot, 'kwe://outside/index.html')).toBeNull();
    expect(resolveRendererAsset(bundleRoot, 'kwe://renderer/%E0%A4%A')).toBeNull();
    expect(resolveRendererAsset(bundleRoot, 'kwe://user@renderer/index.html')).toBeNull();
    expect(
      resolveRendererAsset(bundleRoot, 'kwe://renderer/index.html?path=../secret.txt'),
    ).toBeNull();
    expect(resolveRendererAsset(bundleRoot, 'kwe://renderer/index.html#../secret.txt')).toBeNull();
  });
});
