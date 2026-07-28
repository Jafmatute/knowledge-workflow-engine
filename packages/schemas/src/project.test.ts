import { describe, expect, it } from 'vitest';

import {
  activeProjectDtoSchema,
  createProjectInputSchema,
  createProjectResultSchema,
  getActiveProjectResultSchema,
  openProjectResultSchema,
  projectCancelledResultSchema,
  projectErrorCodeSchema,
  projectErrorDtoSchema,
  projectFailedResultSchema,
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

  it('rejects impossible ISO dates', () => {
    expect(
      projectManifestSchema.safeParse({ ...validManifest, createdAt: '2026-13-40T25:61:61Z' })
        .success,
    ).toBe(false);
  });

  it('rejects non-UTC timestamp', () => {
    expect(
      projectManifestSchema.safeParse({
        ...validManifest,
        createdAt: '2026-07-27T12:00:00.000+02:00',
      }).success,
    ).toBe(false);
  });

  it('rejects schema versions other than 1', () => {
    expect(projectManifestSchema.safeParse({ ...validManifest, schemaVersion: 2 }).success).toBe(
      false,
    );
  });

  it('rejects manifest name with leading or trailing whitespace (no trim)', () => {
    expect(
      projectManifestSchema.safeParse({ ...validManifest, name: '  My Project  ' }).success,
    ).toBe(false);
  });
});

describe('active project DTO schema', () => {
  it('accepts a valid active project', () => {
    expect(activeProjectDtoSchema.parse(validActiveProject)).toEqual(validActiveProject);
  });

  it('rejects unknown keys', () => {
    expect(activeProjectDtoSchema.safeParse({ ...validActiveProject, extra: true }).success).toBe(
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

describe('project error code schema', () => {
  it('accepts all known error codes', () => {
    expect(projectErrorCodeSchema.parse('PROJECT_NAME_INVALID')).toBe('PROJECT_NAME_INVALID');
    expect(projectErrorCodeSchema.parse('PROJECT_ALREADY_EXISTS')).toBe('PROJECT_ALREADY_EXISTS');
    expect(projectErrorCodeSchema.parse('PROJECT_MANIFEST_NOT_FOUND')).toBe(
      'PROJECT_MANIFEST_NOT_FOUND',
    );
    expect(projectErrorCodeSchema.parse('PROJECT_MANIFEST_INVALID')).toBe(
      'PROJECT_MANIFEST_INVALID',
    );
    expect(projectErrorCodeSchema.parse('PROJECT_VERSION_UNSUPPORTED')).toBe(
      'PROJECT_VERSION_UNSUPPORTED',
    );
    expect(projectErrorCodeSchema.parse('PROJECT_PATH_INVALID')).toBe('PROJECT_PATH_INVALID');
    expect(projectErrorCodeSchema.parse('PROJECT_IO_FAILED')).toBe('PROJECT_IO_FAILED');
  });

  it('rejects unknown error code', () => {
    expect(projectErrorCodeSchema.safeParse('UNKNOWN_CODE').success).toBe(false);
  });
});

describe('project error DTO schema', () => {
  it('accepts a valid error DTO', () => {
    expect(projectErrorDtoSchema.parse({ code: 'PROJECT_PATH_INVALID' })).toEqual({
      code: 'PROJECT_PATH_INVALID',
    });
  });

  it('rejects unknown keys', () => {
    expect(
      projectErrorDtoSchema.safeParse({ code: 'PROJECT_IO_FAILED', extra: true }).success,
    ).toBe(false);
  });

  it('rejects missing code', () => {
    expect(projectErrorDtoSchema.safeParse({}).success).toBe(false);
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

  it('accepts failed result with error code', () => {
    expect(
      createProjectResultSchema.parse({
        status: 'failed',
        error: { code: 'PROJECT_IO_FAILED' },
      }),
    ).toEqual({ status: 'failed', error: { code: 'PROJECT_IO_FAILED' } });
  });

  it('rejects unknown keys in cancelled result', () => {
    expect(createProjectResultSchema.safeParse({ status: 'cancelled', extra: true }).success).toBe(
      false,
    );
  });

  it('rejects unknown keys in created result', () => {
    expect(
      createProjectResultSchema.safeParse({
        status: 'created',
        project: validActiveProject,
        extra: true,
      }).success,
    ).toBe(false);
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

  it('accepts failed result with error code', () => {
    expect(
      openProjectResultSchema.parse({
        status: 'failed',
        error: { code: 'PROJECT_MANIFEST_NOT_FOUND' },
      }),
    ).toEqual({ status: 'failed', error: { code: 'PROJECT_MANIFEST_NOT_FOUND' } });
  });

  it('rejects unknown keys in cancelled result', () => {
    expect(openProjectResultSchema.safeParse({ status: 'cancelled', extra: true }).success).toBe(
      false,
    );
  });
});

describe('project cancelled result schema', () => {
  it('accepts cancelled', () => {
    expect(projectCancelledResultSchema.parse({ status: 'cancelled' })).toEqual({
      status: 'cancelled',
    });
  });

  it('rejects unknown keys', () => {
    expect(
      projectCancelledResultSchema.safeParse({ status: 'cancelled', extra: true }).success,
    ).toBe(false);
  });
});

describe('project failed result schema', () => {
  it('accepts failed with error code', () => {
    expect(
      projectFailedResultSchema.parse({ status: 'failed', error: { code: 'PROJECT_IO_FAILED' } }),
    ).toEqual({ status: 'failed', error: { code: 'PROJECT_IO_FAILED' } });
  });

  it('rejects unknown keys', () => {
    expect(
      projectFailedResultSchema.safeParse({
        status: 'failed',
        error: { code: 'PROJECT_IO_FAILED' },
        extra: true,
      }).success,
    ).toBe(false);
  });

  it('rejects missing error', () => {
    expect(projectFailedResultSchema.safeParse({ status: 'failed' }).success).toBe(false);
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
