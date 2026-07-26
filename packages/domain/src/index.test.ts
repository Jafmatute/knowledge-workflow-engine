import { describe, expect, it } from 'vitest';

import { createProjectId } from './index.js';

describe('createProjectId', () => {
  it('preserves the stable identifier value', () => {
    expect(createProjectId('project-123')).toBe('project-123');
  });
});
