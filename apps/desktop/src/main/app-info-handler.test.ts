import { describe, expect, it } from 'vitest';

import { createGetAppInfoHandler } from './app-info-handler.js';

describe('get app info handler', () => {
  it('validates input and the version returned by Electron', () => {
    expect(createGetAppInfoHandler(() => '0.1.0')({})).toEqual({ version: '0.1.0' });
    expect(() => createGetAppInfoHandler(() => '')({})).toThrow();
    expect(() => createGetAppInfoHandler(() => '0.1.0')({ unknown: true })).toThrow();
  });
});
