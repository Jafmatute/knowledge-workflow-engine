import { describe, expect, it, vi } from 'vitest';

import type { DirectoryDialog, ProjectWorkspaceRepository } from './ports.js';
import { ProjectWorkspaceError } from './ports.js';
import { createCreateProjectUseCase, createOpenProjectUseCase } from './use-cases.js';

function createMockDialog(
  createReturns: string | null,
): DirectoryDialog & { _create: ReturnType<typeof vi.fn>; _open: ReturnType<typeof vi.fn> } {
  const pickCreateDirectory = vi.fn(() => Promise.resolve(createReturns));
  const pickOpenDirectory = vi.fn(() => Promise.resolve(createReturns));
  return {
    pickCreateDirectory,
    pickOpenDirectory,
    _create: pickCreateDirectory,
    _open: pickOpenDirectory,
  };
}

function createMockRepo(): ProjectWorkspaceRepository & {
  _create: ReturnType<typeof vi.fn>;
  _open: ReturnType<typeof vi.fn>;
} {
  const create = vi.fn((_name: string, _rootPath: string) =>
    Promise.resolve({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      name: _name,
      rootPath: _rootPath,
      schemaVersion: 1 as const,
    }),
  );
  const open = vi.fn((_rootPath: string) =>
    Promise.resolve({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Project',
      rootPath: _rootPath,
      schemaVersion: 1 as const,
    }),
  );
  return { create, open, _create: create, _open: open };
}

describe('create project use case', () => {
  it('calls only pickCreateDirectory (not pickOpenDirectory)', async () => {
    const dialog = createMockDialog('/projects/test');
    const repo = createMockRepo();
    const useCase = createCreateProjectUseCase(dialog, repo);

    await useCase({ name: 'Test' });

    expect(dialog._create).toHaveBeenCalled();
    expect(dialog._open).not.toHaveBeenCalled();
  });

  it('trims and validates the name', async () => {
    const dialog = createMockDialog('/projects/test');
    const repo = createMockRepo();
    const useCase = createCreateProjectUseCase(dialog, repo);

    const result = await useCase({ name: '  My Project  ' });

    expect(result).toMatchObject({ status: 'created' });
    if (result.status === 'created') {
      expect(result.project.name).toBe('My Project');
    }
  });

  it('returns cancelled when dialog is cancelled', async () => {
    const dialog = createMockDialog(null);
    const repo = createMockRepo();
    const useCase = createCreateProjectUseCase(dialog, repo);

    const result = await useCase({ name: 'Test' });

    expect(result).toEqual({ status: 'cancelled' });
    expect(repo._create).not.toHaveBeenCalled();
  });

  it('returns failed with PROJECT_NAME_INVALID for empty name', async () => {
    const dialog = createMockDialog('/projects/test');
    const repo = createMockRepo();
    const useCase = createCreateProjectUseCase(dialog, repo);

    const result = await useCase({ name: '' });

    expect(result).toEqual({ status: 'failed', error: { code: 'PROJECT_NAME_INVALID' } });
    expect(dialog._create).not.toHaveBeenCalled();
    expect(repo._create).not.toHaveBeenCalled();
  });

  it('returns failed with PROJECT_NAME_INVALID for whitespace-only name', async () => {
    const dialog = createMockDialog('/projects/test');
    const repo = createMockRepo();
    const useCase = createCreateProjectUseCase(dialog, repo);

    const result = await useCase({ name: '   ' });

    expect(result).toEqual({ status: 'failed', error: { code: 'PROJECT_NAME_INVALID' } });
    expect(repo._create).not.toHaveBeenCalled();
  });

  it('returns active project on success', async () => {
    const dialog = createMockDialog('/projects/test');
    const repo = createMockRepo();
    const useCase = createCreateProjectUseCase(dialog, repo);

    const result = await useCase({ name: 'Test' });

    expect(result).toMatchObject({
      status: 'created',
      project: {
        name: 'Test',
        rootPath: '/projects/test',
      },
    });
  });

  it('maps repository errors to matching error code', async () => {
    const dialog = createMockDialog('/projects/test');
    const repo = createMockRepo();
    repo.create = vi.fn(() =>
      Promise.reject(new ProjectWorkspaceError('PROJECT_ALREADY_EXISTS', 'exists')),
    );
    const useCase = createCreateProjectUseCase(dialog, repo);

    const result = await useCase({ name: 'Test' });

    expect(result).toEqual({ status: 'failed', error: { code: 'PROJECT_ALREADY_EXISTS' } });
  });

  it('maps unknown errors to PROJECT_IO_FAILED', async () => {
    const dialog = createMockDialog('/projects/test');
    const repo = createMockRepo();
    repo.create = vi.fn(() => Promise.reject(new Error('Weird error')));
    const useCase = createCreateProjectUseCase(dialog, repo);

    const result = await useCase({ name: 'Test' });

    expect(result).toEqual({ status: 'failed', error: { code: 'PROJECT_IO_FAILED' } });
  });
});

describe('open project use case', () => {
  it('calls only pickOpenDirectory (not pickCreateDirectory)', async () => {
    const dialog = createMockDialog('/projects/test');
    const repo = createMockRepo();
    const useCase = createOpenProjectUseCase(dialog, repo);

    await useCase();

    expect(dialog._open).toHaveBeenCalled();
    expect(dialog._create).not.toHaveBeenCalled();
  });

  it('returns cancelled when dialog is cancelled', async () => {
    const dialog = createMockDialog(null);
    const repo = createMockRepo();
    const useCase = createOpenProjectUseCase(dialog, repo);

    const result = await useCase();

    expect(result).toEqual({ status: 'cancelled' });
    expect(repo._open).not.toHaveBeenCalled();
  });

  it('returns active project on success', async () => {
    const dialog = createMockDialog('/projects/test');
    const repo = createMockRepo();
    const useCase = createOpenProjectUseCase(dialog, repo);

    const result = await useCase();

    expect(result).toMatchObject({
      status: 'opened',
      project: {
        rootPath: '/projects/test',
      },
    });
  });

  it('maps repository errors to matching error code', async () => {
    const dialog = createMockDialog('/projects/test');
    const repo = createMockRepo();
    repo.open = vi.fn(() =>
      Promise.reject(new ProjectWorkspaceError('PROJECT_MANIFEST_NOT_FOUND', 'not found')),
    );
    const useCase = createOpenProjectUseCase(dialog, repo);

    const result = await useCase();

    expect(result).toEqual({ status: 'failed', error: { code: 'PROJECT_MANIFEST_NOT_FOUND' } });
  });

  it('maps unknown errors to PROJECT_IO_FAILED', async () => {
    const dialog = createMockDialog('/projects/test');
    const repo = createMockRepo();
    repo.open = vi.fn(() => Promise.reject(new Error('Random error')));
    const useCase = createOpenProjectUseCase(dialog, repo);

    const result = await useCase();

    expect(result).toEqual({ status: 'failed', error: { code: 'PROJECT_IO_FAILED' } });
  });
});
