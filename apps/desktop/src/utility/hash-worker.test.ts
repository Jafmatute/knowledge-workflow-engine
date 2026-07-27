import { describe, expect, it } from 'vitest';

import { calculateDiagnosticHash } from './hash-worker.js';

describe('hash worker', () => {
  it('calculates a UTF-8 SHA-256 result', () => {
    expect(calculateDiagnosticHash('abc')).toEqual({
      algorithm: 'sha256',
      digest: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    });
  });
});
