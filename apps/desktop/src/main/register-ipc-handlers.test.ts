import { describe, expect, it } from 'vitest';

import { IPC_CHANNELS } from '@kwe/contracts';

describe('IPC channel enumeration', () => {
  it('exposes only the app information channel', () => {
    expect(IPC_CHANNELS).toEqual({ appGetInfo: 'app:get-info' });
  });
});
