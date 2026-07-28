import { describe, expect, it } from 'vitest';

import {
  diagnosticHashInputSchema,
  diagnosticHashResultSchema,
  MAX_DIAGNOSTIC_HASH_INPUT_BYTES,
  utilityDiagnosticHashFailureSchema,
  utilityDiagnosticHashRequestSchema,
  utilityDiagnosticHashResponseSchema,
} from './index.js';

describe('utility hash schemas', () => {
  it('accepts a bounded UTF-8 request and a SHA-256 result', () => {
    expect(diagnosticHashInputSchema.parse({ text: 'verified' })).toEqual({ text: 'verified' });
    expect(
      diagnosticHashResultSchema.parse({
        algorithm: 'sha256',
        digest: 'a'.repeat(64),
      }),
    ).toEqual({ algorithm: 'sha256', digest: 'a'.repeat(64) });
  });

  it('rejects empty, oversized, and malformed external values', () => {
    expect(() => diagnosticHashInputSchema.parse({ text: '' })).toThrow();
    expect(() =>
      diagnosticHashInputSchema.parse({ text: 'a'.repeat(MAX_DIAGNOSTIC_HASH_INPUT_BYTES + 1) }),
    ).toThrow();
    expect(() => diagnosticHashInputSchema.parse({ text: '😀'.repeat(1025) })).toThrow();
    expect(() =>
      diagnosticHashResultSchema.parse({ algorithm: 'sha256', digest: 'invalid' }),
    ).toThrow();
  });

  it('validates strict protocol envelopes including failures', () => {
    const requestId = '0a8d2ce5-8a93-49bc-aef7-4c5bb6e1c427';
    expect(
      utilityDiagnosticHashRequestSchema.safeParse({
        kind: 'diagnostic-hash-request',
        requestId,
        input: { text: 'verified' },
        extra: true,
      }).success,
    ).toBe(false);
    expect(
      utilityDiagnosticHashFailureSchema.parse({
        kind: 'diagnostic-hash-failure',
        requestId,
        error: { code: 'UTILITY_PROCESS_FAILED' },
      }),
    ).toMatchObject({ kind: 'diagnostic-hash-failure' });
    expect(
      utilityDiagnosticHashResponseSchema.safeParse({
        kind: 'diagnostic-hash-failure',
        requestId,
        error: { code: 'OTHER' },
      }).success,
    ).toBe(false);
  });
});
