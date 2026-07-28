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

export type State = 'starting' | 'request-sent' | 'terminal';

export interface UtilityProcessHandle {
  postMessage(message: unknown): void;
  kill(): boolean;
  onMessage(listener: (message: unknown) => void): void;
  onExit(listener: (code: number) => void): void;
  onError(listener: () => void): void;
}

type SpawnUtilityProcess = (modulePath: string) => UtilityProcessHandle;

function spawnUtilityProcess(modulePath: string): UtilityProcessHandle {
  const process = utilityProcess.fork(modulePath);

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
      let state: State = 'starting';
      let settled = false;

      const settle = (action: () => void) => {
        if (settled) return;
        settled = true;
        state = 'terminal';
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
            if (state !== 'starting') {
              settle(() => reject(new Error('Unexpected utility-ready transition.')));
              return;
            }
            state = 'request-sent';
            worker.postMessage({
              kind: 'diagnostic-hash-request',
              requestId,
              input: validatedInput,
            });
            return;
          }

          if (state !== 'request-sent') {
            settle(() => reject(new Error('Unexpected utility process response.')));
            return;
          }

          const response = utilityDiagnosticHashResponseSchema.parse(message);
          if (response.requestId !== requestId) {
            settle(() => reject(new Error('Utility process request identifier mismatch.')));
            return;
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

      worker.onExit((code) => {
        if (state === 'terminal') return;
        const message =
          code === 0
            ? 'Utility process exited before completing.'
            : `Utility process exited unexpectedly (${code}).`;
        settle(() => reject(new Error(message)));
      });

      worker.onError(() => {
        if (state === 'terminal') return;
        settle(() => reject(new Error('Utility process failed.')));
      });
    });
  };
}
