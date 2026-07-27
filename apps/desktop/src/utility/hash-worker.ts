import { createHash } from 'node:crypto';

import { parentPort } from 'electron';

import {
  diagnosticHashResultSchema,
  utilityDiagnosticHashRequestSchema,
  utilityDiagnosticHashSuccessSchema,
  utilityReadySchema,
  type DiagnosticHashResult,
} from '@kwe/schemas';

export function calculateDiagnosticHash(text: string): DiagnosticHashResult {
  const result = {
    algorithm: 'sha256' as const,
    digest: createHash('sha256').update(text, 'utf8').digest('hex'),
  };

  return diagnosticHashResultSchema.parse(result);
}

if (parentPort !== undefined) {
  parentPort.on('message', (message: unknown) => {
    try {
      const request = utilityDiagnosticHashRequestSchema.parse(message);
      parentPort.postMessage(
        utilityDiagnosticHashSuccessSchema.parse({
          kind: 'diagnostic-hash-success',
          requestId: request.requestId,
          result: calculateDiagnosticHash(request.input.text),
        }),
      );
    } catch {
      // Invalid messages are untrusted and cannot be correlated safely.
    }
  });
  parentPort.postMessage(utilityReadySchema.parse({ kind: 'utility-ready' }));
}
