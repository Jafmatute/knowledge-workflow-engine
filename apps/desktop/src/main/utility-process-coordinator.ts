import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

import { utilityProcess } from 'electron';

import {
  diagnosticHashInputSchema,
  diagnosticHashResultSchema,
  utilityReadySchema,
  utilityDiagnosticHashResponseSchema,
  type DiagnosticHashInput,
  type DiagnosticHashResult,
} from '@kwe/schemas';

const UTILITY_TIMEOUT_MS = 5_000;

export interface UtilityProcessHandle {
  postMessage(message: unknown): void;
  kill(): boolean;
  onMessage(listener: (message: unknown) => void): void;
  onExit(listener: (code: number) => void): void;
  onError(listener: () => void): void;
}

type SpawnUtilityProcess = (modulePath: string) => UtilityProcessHandle;

function spawnUtilityProcess(modulePath: string): UtilityProcessHandle {
  const process = utilityProcess.fork(modulePath, [], { sandbox: false });

  return {
    postMessage: (message) => process.postMessage(message),
    kill: () => process.kill(),
    onMessage: (listener) => void process.on('message', listener),
    onExit: (listener) => void process.once('exit', listener),
    onError: (listener) => void process.once('error', listener),
  };
}

export function createComputeDiagnosticHashHandler(
  spawn: SpawnUtilityProcess = spawnUtilityProcess,
  workerPath = join(__dirname, 'hash-worker.cjs'),
) {
  return (input: unknown): Promise<DiagnosticHashResult> => {
    const validatedInput: DiagnosticHashInput = diagnosticHashInputSchema.parse(input);
    const requestId = randomUUID();
    const worker = spawn(workerPath);

    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (action: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        worker.kill();
        action();
      };
      const timeout = setTimeout(() => {
        settle(() => reject(new Error('Utility process timed out.')));
      }, UTILITY_TIMEOUT_MS);

      worker.onMessage((message: unknown) => {
        try {
          if (utilityReadySchema.safeParse(message).success) {
            worker.postMessage({ kind: 'diagnostic-hash-request', requestId, input: validatedInput });
            return;
          }
          const response = utilityDiagnosticHashResponseSchema.parse(message);
          if (response.requestId !== requestId) {
            throw new Error('Utility process returned an unexpected response.');
          }
          if (response.kind === 'diagnostic-hash-failure') {
            settle(() => reject(new Error('Utility process failed.')));
            return;
          }
          settle(() => resolve(diagnosticHashResultSchema.parse(response.result)));
        } catch {
          settle(() => reject(new Error('Utility process returned an invalid response.')));
        }
      });
      worker.onError(() => settle(() => reject(new Error('Utility process failed.'))));
      worker.onExit((code) => {
        if (code !== 0) settle(() => reject(new Error('Utility process exited unexpectedly.')));
      });
    });
  };
}
