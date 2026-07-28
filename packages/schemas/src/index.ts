export * from './project.js';

import { z } from 'zod';

export const getAppInfoInputSchema = z.object({}).strict();
export type GetAppInfoInput = z.infer<typeof getAppInfoInputSchema>;

export const appInfoSchema = z
  .object({
    version: z.string().min(1),
  })
  .strict();
export type AppInfo = z.infer<typeof appInfoSchema>;

export const MAX_DIAGNOSTIC_HASH_INPUT_BYTES = 4 * 1024;

function getUtf8ByteLength(value: string): number {
  let byteLength = 0;

  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) continue;
    byteLength += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
  }

  return byteLength;
}

export const diagnosticHashInputSchema = z
  .object({
    text: z
      .string()
      .min(1)
      .refine((value) => getUtf8ByteLength(value) <= MAX_DIAGNOSTIC_HASH_INPUT_BYTES),
  })
  .strict();
export type DiagnosticHashInput = z.infer<typeof diagnosticHashInputSchema>;

export const diagnosticHashResultSchema = z
  .object({
    algorithm: z.literal('sha256'),
    digest: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type DiagnosticHashResult = z.infer<typeof diagnosticHashResultSchema>;

export const utilityDiagnosticHashRequestSchema = z
  .object({
    kind: z.literal('diagnostic-hash-request'),
    requestId: z.string().uuid(),
    input: diagnosticHashInputSchema,
  })
  .strict();
export type UtilityDiagnosticHashRequest = z.infer<typeof utilityDiagnosticHashRequestSchema>;

export const utilityReadySchema = z.object({ kind: z.literal('utility-ready') }).strict();

export const utilityDiagnosticHashSuccessSchema = z
  .object({
    kind: z.literal('diagnostic-hash-success'),
    requestId: z.string().uuid(),
    result: diagnosticHashResultSchema,
  })
  .strict();
export type UtilityDiagnosticHashSuccess = z.infer<typeof utilityDiagnosticHashSuccessSchema>;

export const utilityDiagnosticHashFailureSchema = z
  .object({
    kind: z.literal('diagnostic-hash-failure'),
    requestId: z.string().uuid(),
    error: z.object({ code: z.literal('UTILITY_PROCESS_FAILED') }).strict(),
  })
  .strict();
export type UtilityDiagnosticHashFailure = z.infer<typeof utilityDiagnosticHashFailureSchema>;

export const utilityDiagnosticHashResponseSchema = z.discriminatedUnion('kind', [
  utilityDiagnosticHashSuccessSchema,
  utilityDiagnosticHashFailureSchema,
]);
export type UtilityDiagnosticHashResponse = z.infer<typeof utilityDiagnosticHashResponseSchema>;
