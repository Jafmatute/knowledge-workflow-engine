import { describe, expect, it } from 'vitest';

import {
  createComputeDiagnosticHashHandler,
  type UtilityProcessHandle,
} from './utility-process-coordinator.js';

function createWorker(): {
  readonly worker: UtilityProcessHandle;
  readonly emitMessage: (message: unknown) => void;
  readonly messages: unknown[];
  readonly getKillCount: () => number;
} {
  let messageListener: ((message: unknown) => void) | undefined;
  let killCount = 0;
  const messages: unknown[] = [];
  const worker: UtilityProcessHandle = {
    postMessage: (message) => messages.push(message),
    kill: () => {
      killCount += 1;
      return true;
    },
    onMessage: (listener) => {
      messageListener = listener;
    },
    onExit: () => undefined,
    onError: () => undefined,
  };

  return {
    worker,
    emitMessage(message) {
      messageListener?.(message);
    },
    messages,
    getKillCount: () => killCount,
  };
}

describe('utility process coordinator', () => {
  it('validates a correlated SHA-256 result and terminates the worker', async () => {
    const { worker, emitMessage, getKillCount, messages } = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });
    emitMessage({ kind: 'utility-ready' });
    const request = messages[0] as { requestId: string };

    emitMessage({
      kind: 'diagnostic-hash-success',
      requestId: request.requestId,
      result: {
        algorithm: 'sha256',
        digest: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      },
    });

    await expect(result).resolves.toMatchObject({ algorithm: 'sha256' });
    expect(getKillCount()).toBe(1);
  });

  it('rejects malformed utility responses', async () => {
    const { worker, emitMessage } = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    emitMessage({ kind: 'diagnostic-hash-success', requestId: 'bad', result: {} });

    await expect(result).rejects.toThrow('invalid response');
  });
});
