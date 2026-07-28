import { describe, expect, it } from 'vitest';

import {
  activeProjectSchema,
  createProjectInputSchema,
  createProjectResultSchema,
  getActiveProjectResultSchema,
  openProjectResultSchema,
  projectManifestSchema,
} from './index.js';

const validManifest = {
  schemaVersion: 1,
  projectId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'My Project',
  createdAt: '2026-07-27T12:00:00.000Z',
  updatedAt: '2026-07-27T12:00:00.000Z',
};

const validActiveProject = {
  projectId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'My Project',
  rootPath: 'C:\\projects\\my-project',
  schemaVersion: 1,
};

describe('project manifest schema', () => {
  it('accepts a valid manifest', () => {
    expect(projectManifestSchema.parse(validManifest)).toEqual(validManifest);
  });

  it('rejects unknown keys', () => {
    expect(projectManifestSchema.safeParse({ ...validManifest, extra: true }).success).toBe(false);
  });

  it('rejects invalid UUID', () => {
    expect(
      projectManifestSchema.safeParse({ ...validManifest, projectId: 'not-a-uuid' }).success,
    ).toBe(false);
  });

  it('rejects blank name', () => {
    expect(projectManifestSchema.safeParse({ ...validManifest, name: '' }).success).toBe(false);
  });

  it('rejects whitespace-only name', () => {
    expect(projectManifestSchema.safeParse({ ...validManifest, name: '   ' }).success).toBe(false);
  });

  it('rejects name exceeding 100 characters', () => {
    expect(
      projectManifestSchema.safeParse({ ...validManifest, name: 'a'.repeat(101) }).success,
    ).toBe(false);
  });

  it('rejects invalid timestamps', () => {
    expect(
      projectManifestSchema.safeParse({ ...validManifest, createdAt: 'not-a-date' }).success,
    ).toBe(false);
  });

  it('rejects schema versions other than 1', () => {
    expect(projectManifestSchema.safeParse({ ...validManifest, schemaVersion: 2 }).success).toBe(
      false,
    );
  });

  it('trims whitespace from name', () => {
    const result = projectManifestSchema.parse({ ...validManifest, name: '  My Project  ' });
    expect(result.name).toBe('My Project');
  });
});

describe('active project schema', () => {
  it('accepts a valid active project', () => {
    expect(activeProjectSchema.parse(validActiveProject)).toEqual(validActiveProject);
  });

  it('rejects unknown keys', () => {
    expect(activeProjectSchema.safeParse({ ...validActiveProject, extra: true }).success).toBe(
      false,
    );
  });
});

describe('create project input schema', () => {
  it('accepts a valid name', () => {
    expect(createProjectInputSchema.parse({ name: 'My Project' })).toEqual({
      name: 'My Project',
    });
  });

  it('rejects empty name', () => {
    expect(createProjectInputSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('rejects whitespace-only name', () => {
    expect(createProjectInputSchema.safeParse({ name: '   ' }).success).toBe(false);
  });

  it('rejects unknown keys', () => {
    expect(createProjectInputSchema.safeParse({ name: 'test', extra: true }).success).toBe(false);
  });
});

describe('create project result schema', () => {
  it('accepts created result', () => {
    expect(
      createProjectResultSchema.parse({
        status: 'created',
        project: validActiveProject,
      }),
    ).toEqual({ status: 'created', project: validActiveProject });
  });

  it('accepts cancelled result', () => {
    expect(createProjectResultSchema.parse({ status: 'cancelled' })).toEqual({
      status: 'cancelled',
    });
  });
});

describe('open project result schema', () => {
  it('accepts opened result', () => {
    expect(
      openProjectResultSchema.parse({
        status: 'opened',
        project: validActiveProject,
      }),
    ).toEqual({ status: 'opened', project: validActiveProject });
  });

  it('accepts cancelled result', () => {
    expect(openProjectResultSchema.parse({ status: 'cancelled' })).toEqual({
      status: 'cancelled',
    });
  });
});

describe('get active project result schema', () => {
  it('accepts an active project', () => {
    expect(getActiveProjectResultSchema.parse(validActiveProject)).toEqual(validActiveProject);
  });

  it('accepts null', () => {
    expect(getActiveProjectResultSchema.parse(null)).toBeNull();
  });
});
