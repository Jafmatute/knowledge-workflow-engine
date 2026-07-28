import { createHash } from 'node:crypto';

import {
  diagnosticHashResultSchema,
  utilityDiagnosticHashFailureSchema,
  utilityDiagnosticHashRequestSchema,
  utilityDiagnosticHashSuccessSchema,
  utilityReadySchema,
  type DiagnosticHashResult,
  type UtilityDiagnosticHashResponse,
} from '@kwe/schemas';

export function calculateDiagnosticHash(text: string): DiagnosticHashResult {
  const result = {
    algorithm: 'sha256' as const,
    digest: createHash('sha256').update(text, 'utf8').digest('hex'),
  };

  return diagnosticHashResultSchema.parse(result);
}

export function handleDiagnosticHashRequest(
  message: unknown,
  calculateHash: (text: string) => DiagnosticHashResult = calculateDiagnosticHash,
): UtilityDiagnosticHashResponse | null {
  const parsed = utilityDiagnosticHashRequestSchema.safeParse(message);
  if (!parsed.success) return null;

  try {
    return utilityDiagnosticHashSuccessSchema.parse({
      kind: 'diagnostic-hash-success',
      requestId: parsed.data.requestId,
      result: calculateHash(parsed.data.input.text),
    });
  } catch {
    return utilityDiagnosticHashFailureSchema.parse({
      kind: 'diagnostic-hash-failure',
      requestId: parsed.data.requestId,
      error: { code: 'UTILITY_PROCESS_FAILED' },
    });
  }
}

const port = process.parentPort;

if (port !== undefined) {
  port.on('message', (event: { data: unknown }) => {
    const response = handleDiagnosticHashRequest(event.data);
    if (response !== null) {
      port.postMessage(response);
    }
  });
  port.postMessage(utilityReadySchema.parse({ kind: 'utility-ready' }));
}
