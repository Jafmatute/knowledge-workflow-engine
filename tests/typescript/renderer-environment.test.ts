import { describe, expect, it } from 'vitest';

import {
  activeProjectSchema,
  createProjectInputSchema,
  createProjectResultSchema,
  getActiveProjectResultSchema,
  openProjectResultSchema,
} from '@kwe/schemas';

describe('renderer environment types', () => {
  it('supports project creation schemas', () => {
    expect(createProjectInputSchema.safeParse({ name: 'Test' }).success).toBe(true);
  });

  it('supports project result schemas', () => {
    expect(createProjectResultSchema.safeParse({ status: 'cancelled' }).success).toBe(true);
    expect(openProjectResultSchema.safeParse({ status: 'cancelled' }).success).toBe(true);
  });

  it('supports active project and null', () => {
    expect(getActiveProjectResultSchema.parse(null)).toBeNull();
    expect(
      activeProjectSchema.parse({
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
        rootPath: '/tmp/test',
        schemaVersion: 1,
      }).name,
    ).toBe('Test');
  });
});
