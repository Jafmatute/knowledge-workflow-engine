import { describe, expect, it } from 'vitest';

import { calculateDiagnosticHash, handleDiagnosticHashRequest } from './hash-worker.js';
import {
  utilityDiagnosticHashFailureSchema,
  utilityDiagnosticHashSuccessSchema,
} from '@kwe/schemas';

describe('hash worker', () => {
  const requestId = '0a8d2ce5-8a93-49bc-aef7-4c5bb6e1c427';

  it('calculates a UTF-8 SHA-256 result', () => {
    expect(calculateDiagnosticHash('abc')).toEqual({
      algorithm: 'sha256',
      digest: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    });
  });

  it('returns a success envelope for a valid request', () => {
    const result = handleDiagnosticHashRequest({
      kind: 'diagnostic-hash-request',
      requestId,
      input: { text: 'abc' },
    });

    expect(result).not.toBeNull();
    if (result?.kind === 'diagnostic-hash-success') {
      expect(result.requestId).toBe(requestId);
      expect(result.result.algorithm).toBe('sha256');
      expect(result.result.digest).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('returns null for an uncorrelatable message', () => {
    const message: unknown = { random: true };
    const result = handleDiagnosticHashRequest(message);

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

    expect(result).not.toBeNull();
    if (result?.kind === 'diagnostic-hash-failure') {
      expect(result.requestId).toBe(requestId);
      expect(result.error).toEqual({ code: 'UTILITY_PROCESS_FAILED' });
    }
  });

  it('failure envelope does not contain the exception message or source text', () => {
    const throwingHash = (_text: string): never => {
      throw new Error('this message must not appear');
    };

    const result = handleDiagnosticHashRequest(
      { kind: 'diagnostic-hash-request', requestId, input: { text: 'sensitive input' } },
      throwingHash,
    );

    expect(result).not.toBeNull();
    if (result?.kind === 'diagnostic-hash-failure') {
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('this message must not appear');
      expect(serialized).not.toContain('sensitive input');
    }
  });

  it('success output passes its Zod schema', () => {
    const result = handleDiagnosticHashRequest({
      kind: 'diagnostic-hash-request',
      requestId,
      input: { text: 'abc' },
    });

    expect(result).not.toBeNull();
    if (result?.kind === 'diagnostic-hash-success') {
      expect(() => utilityDiagnosticHashSuccessSchema.parse(result)).not.toThrow();
    }
  });

  it('failure output passes its Zod schema', () => {
    const throwingHash = (_text: string): never => {
      throw new Error('any error');
    };

    const result = handleDiagnosticHashRequest(
      { kind: 'diagnostic-hash-request', requestId, input: { text: 'abc' } },
      throwingHash,
    );

    expect(result).not.toBeNull();
    if (result?.kind === 'diagnostic-hash-failure') {
      expect(() => utilityDiagnosticHashFailureSchema.parse(result)).not.toThrow();
    }
  });
});
