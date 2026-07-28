import { describe, expect, it } from 'vitest';

import { IPC_CHANNELS } from '@kwe/contracts';

describe('IPC channel enumeration', () => {
  it('exposes only the approved S02 channels', () => {
    expect(IPC_CHANNELS).toEqual({
      appGetInfo: 'app:get-info',
      systemComputeDiagnosticHash: 'system:compute-diagnostic-hash',
      projectCreate: 'project:create',
      projectOpen: 'project:open',
      projectGetActive: 'project:get-active',
    });
  });
});
