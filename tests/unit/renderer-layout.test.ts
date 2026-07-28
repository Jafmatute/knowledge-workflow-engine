import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { resolveRendererAsset } from '../../apps/desktop/src/main/renderer-asset-path.js';

const ROOT = resolve('.vite/renderer/main_window');

describe('renderer layout', () => {
  it('maps kwe://renderer/index.html to the renderer root', () => {
    expect(resolveRendererAsset(ROOT, 'kwe://renderer/index.html')).toBe(
      resolve(ROOT, 'index.html'),
    );
  });

  it('maps kwe://renderer/ to index.html by default', () => {
    expect(resolveRendererAsset(ROOT, 'kwe://renderer/')).toBe(resolve(ROOT, 'index.html'));
  });

  it('maps kwe://renderer/assets/app.js inside the root', () => {
    expect(resolveRendererAsset(ROOT, 'kwe://renderer/assets/app.js')).toBe(
      resolve(ROOT, 'assets/app.js'),
    );
  });

  it('rejects traversal outside the root', () => {
    expect(resolveRendererAsset(ROOT, 'kwe://renderer/..%2F..%2Fpackage.json')).toBeNull();
  });

  it('rejects a different hostname', () => {
    expect(resolveRendererAsset(ROOT, 'kwe://other/assets/app.js')).toBeNull();
  });

  it('rejects query strings', () => {
    expect(resolveRendererAsset(ROOT, 'kwe://renderer/index.html?v=1')).toBeNull();
  });

  it('rejects fragments', () => {
    expect(resolveRendererAsset(ROOT, 'kwe://renderer/index.html#section')).toBeNull();
  });

  it('rejects non-kwe protocols', () => {
    expect(resolveRendererAsset(ROOT, 'https://example.com/')).toBeNull();
  });
});
