import { createHash } from 'node:crypto';

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

const port = process.parentPort;

if (port !== undefined) {
  port.on('message', (message: unknown) => {
    const parsed = utilityDiagnosticHashRequestSchema.safeParse(message);
    if (!parsed.success) return;

    port.postMessage(
      utilityDiagnosticHashSuccessSchema.parse({
        kind: 'diagnostic-hash-success',
        requestId: parsed.data.requestId,
        result: calculateDiagnosticHash(parsed.data.input.text),
      }),
    );
  });

  port.postMessage(utilityReadySchema.parse({ kind: 'utility-ready' }));
}
