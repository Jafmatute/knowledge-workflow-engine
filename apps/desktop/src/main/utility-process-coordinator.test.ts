import { describe, expect, it, vi } from 'vitest';

import {
  createComputeDiagnosticHashHandler,
  type UtilityProcessHandle,
} from './utility-process-coordinator.js';

function createWorker(): {
  readonly worker: UtilityProcessHandle;
  readonly emitMessage: (message: unknown) => void;
  readonly emitExit: (code: number) => void;
  readonly emitError: () => void;
  readonly messages: unknown[];
  readonly killCount: number;
} {
  let messageListener: ((message: unknown) => void) | undefined;
  let exitListener: ((code: number) => void) | undefined;
  let errorListener: (() => void) | undefined;
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
    onExit: (listener) => {
      exitListener = listener;
    },
    onError: (listener) => {
      errorListener = listener;
    },
  };

  return {
    worker,
    emitMessage: (message) => messageListener?.(message),
    emitExit: (code) => exitListener?.(code),
    emitError: () => errorListener?.(),
    messages,
    get killCount() {
      return killCount;
    },
  };
}

function requestId(w: { messages: unknown[] }): string {
  const first = w.messages[0];
  if (typeof first === 'object' && first !== null) {
    return (first as Record<string, unknown>).requestId as string;
  }
  return '';
}

const validDigest = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

describe('utility process coordinator', () => {
  it('resolves with the hash result for a correlated response', async () => {
    const w = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => w.worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    w.emitMessage({ kind: 'utility-ready' });
    const id = requestId(w);

    w.emitMessage({
      kind: 'diagnostic-hash-success',
      requestId: id,
      result: { algorithm: 'sha256', digest: validDigest },
    });

    await expect(result).resolves.toMatchObject({ algorithm: 'sha256' });
    expect(w.killCount).toBe(1);
  });

  it('rejects with a generic error for a validated failure envelope', async () => {
    const w = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => w.worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    w.emitMessage({ kind: 'utility-ready' });
    const id = requestId(w);

    w.emitMessage({
      kind: 'diagnostic-hash-failure',
      requestId: id,
      error: { code: 'UTILITY_PROCESS_FAILED' },
    });

    await expect(result).rejects.toThrow('Utility process failed.');
    expect(w.killCount).toBe(1);
  });

  it('rejects a valid response with mismatched request ID', async () => {
    const w = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => w.worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    w.emitMessage({ kind: 'utility-ready' });

    w.emitMessage({
      kind: 'diagnostic-hash-success',
      requestId: '00000000-0000-0000-0000-000000000000',
      result: { algorithm: 'sha256', digest: 'a'.repeat(64) },
    });

    await expect(result).rejects.toThrow('request identifier mismatch');
    expect(w.killCount).toBe(1);
  });

  it('rejects a malformed response body', async () => {
    const w = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => w.worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    w.emitMessage({ kind: 'utility-ready' });
    w.emitMessage({ kind: 'diagnostic-hash-success', requestId: 'bad', result: {} });

    await expect(result).rejects.toThrow('invalid response');
    expect(w.killCount).toBe(1);
  });

  it('rejects exit with code 0 before any response', async () => {
    const w = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => w.worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    w.emitExit(0);

    await expect(result).rejects.toThrow('Utility process exited before completing.');
    expect(w.killCount).toBe(1);
  });

  it('rejects exit with non-zero code before response', async () => {
    const w = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => w.worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    w.emitExit(1);

    await expect(result).rejects.toThrow('Utility process exited unexpectedly (1).');
    expect(w.killCount).toBe(1);
  });

  it('rejects on worker error event before response', async () => {
    const w = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => w.worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    w.emitError();

    await expect(result).rejects.toThrow('Utility process failed.');
    expect(w.killCount).toBe(1);
  });

  it('rejects on timeout and performs cleanup once', async () => {
    vi.useFakeTimers();
    const w = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => w.worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    vi.advanceTimersByTime(5_000);

    await expect(result).rejects.toThrow('Utility process timed out.');
    expect(w.killCount).toBe(1);
    vi.useRealTimers();
  });

  it('performs cleanup exactly once after a success', async () => {
    const w = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => w.worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    w.emitMessage({ kind: 'utility-ready' });
    const id = requestId(w);
    w.emitMessage({
      kind: 'diagnostic-hash-success',
      requestId: id,
      result: { algorithm: 'sha256', digest: 'a'.repeat(64) },
    });
    w.emitMessage({
      kind: 'diagnostic-hash-success',
      requestId: id,
      result: { algorithm: 'sha256', digest: 'b'.repeat(64) },
    });

    await expect(result).resolves.toBeTruthy();
    expect(w.killCount).toBe(1);
  });

  it('performs cleanup exactly once after a failure envelope', async () => {
    const w = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => w.worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    w.emitMessage({ kind: 'utility-ready' });
    const id = requestId(w);
    w.emitMessage({
      kind: 'diagnostic-hash-failure',
      requestId: id,
      error: { code: 'UTILITY_PROCESS_FAILED' },
    });

    await expect(result).rejects.toThrow();
    expect(w.killCount).toBe(1);
  });

  it('rejects a duplicate ready message', async () => {
    const w = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => w.worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    w.emitMessage({ kind: 'utility-ready' });
    w.emitMessage({ kind: 'utility-ready' });

    await expect(result).rejects.toThrow('Unexpected utility-ready transition');
    expect(w.killCount).toBe(1);
  });

  it('rejects a terminal response before ready', async () => {
    const w = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => w.worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    w.emitMessage({
      kind: 'diagnostic-hash-success',
      requestId: '00000000-0000-0000-0000-000000000000',
      result: { algorithm: 'sha256', digest: 'a'.repeat(64) },
    });

    await expect(result).rejects.toThrow('Unexpected utility process response');
    expect(w.killCount).toBe(1);
  });

  it('error from the renderer is generic and does not contain internals', async () => {
    const w = createWorker();
    const handler = createComputeDiagnosticHashHandler(() => w.worker, 'hash-worker.cjs');
    const result = handler({ text: 'abc' });

    w.emitExit(1);

    await expect(result).rejects.not.toThrow('abc');
    await expect(result).rejects.not.toThrow(process.cwd());
  });
});
