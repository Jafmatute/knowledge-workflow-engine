import { describe, expect, it } from 'vitest';

import { IPC_CHANNELS } from '@kwe/contracts';

describe('IPC channel enumeration', () => {
  it('exposes only the approved bootstrap channels', () => {
    expect(IPC_CHANNELS).toEqual({
      appGetInfo: 'app:get-info',
      systemComputeDiagnosticHash: 'system:compute-diagnostic-hash',
    });
  });
});
