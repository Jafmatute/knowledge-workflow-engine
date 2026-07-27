import { describe, expect, it } from 'vitest';

import { calculateDiagnosticHash, handleDiagnosticHashRequest } from './hash-worker.js';

describe('hash worker', () => {
  const requestId = '0a8d2ce5-8a93-49bc-aef7-4c5bb6e1c427';

  it('calculates a UTF-8 SHA-256 result', () => {
    expect(calculateDiagnosticHash('abc')).toEqual({
      algorithm: 'sha256',
      digest: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    });
  });

  it('returns a success envelope for a valid request', () => {
    const result = handleDiagnosticHashRequest(
      { kind: 'diagnostic-hash-request', requestId, input: { text: 'abc' } },
      calculateDiagnosticHash,
    );

    expect(result).toMatchObject({
      kind: 'diagnostic-hash-success',
      requestId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      result: expect.objectContaining({ algorithm: 'sha256' }),
    });
  });

  it('returns null for an uncorrelatable message', () => {
    const message: unknown = { random: true };
    const result = handleDiagnosticHashRequest(message, calculateDiagnosticHash);

    expect(result).toBeNull();
  });

  it('returns a failure envelope when hash computation throws', () => {
    const throwingHash = (_text: string): never => {
      throw new Error('internal failure');
    };

    const result = handleDiagnosticHashRequest(
      { kind: 'diagnostic-hash-request', requestId, input: { text: 'abc' } },
      throwingHash,
    );

    expect(result).toMatchObject({
      kind: 'diagnostic-hash-failure',
      requestId,
      error: { code: 'UTILITY_PROCESS_FAILED' },
    });
  });
});
