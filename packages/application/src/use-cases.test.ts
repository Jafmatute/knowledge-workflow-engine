/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, vi } from 'vitest';

import type { DirectoryDialog, ProjectWorkspaceRepository } from './ports.js';
import { createCreateProjectUseCase, createOpenProjectUseCase } from './use-cases.js';

function createMockDialog(returns: string | null): DirectoryDialog {
  return { pickDirectory: vi.fn(() => Promise.resolve(returns)) };
}

function createMockRepo(): ProjectWorkspaceRepository {
  const mockCreate = vi.fn((_name: string, _rootPath: string) =>
    Promise.resolve({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      name: _name,
      rootPath: _rootPath,
      schemaVersion: 1 as const,
    }),
  );

  const mockOpen = vi.fn((_rootPath: string) =>
    Promise.resolve({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Project',
      rootPath: _rootPath,
      schemaVersion: 1 as const,
    }),
  );

  return { create: mockCreate, open: mockOpen };
}

describe('create project use case', () => {
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
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejects an empty name', async () => {
    const dialog = createMockDialog('/projects/test');
    const repo = createMockRepo();
    const useCase = createCreateProjectUseCase(dialog, repo);

    await expect(useCase({ name: '' })).rejects.toThrow();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only name', async () => {
    const dialog = createMockDialog('/projects/test');
    const repo = createMockRepo();
    const useCase = createCreateProjectUseCase(dialog, repo);

    await expect(useCase({ name: '   ' })).rejects.toThrow();
    expect(repo.create).not.toHaveBeenCalled();
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
});

describe('open project use case', () => {
  it('returns cancelled when dialog is cancelled', async () => {
    const dialog = createMockDialog(null);
    const repo = createMockRepo();
    const useCase = createOpenProjectUseCase(dialog, repo);

    const result = await useCase();

    expect(result).toEqual({ status: 'cancelled' });
    expect(repo.open).not.toHaveBeenCalled();
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
});
