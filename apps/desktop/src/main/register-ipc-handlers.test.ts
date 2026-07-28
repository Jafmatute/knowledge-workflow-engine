import { describe, expect, it, vi } from 'vitest';

import { IPC_CHANNELS } from '@kwe/contracts';
import type { DirectoryDialog, ProjectWorkspaceRepository } from '@kwe/application';

vi.mock('electron', () => ({
  dialog: { showOpenDialog: vi.fn() },
  app: {},
  BrowserWindow: vi.fn(),
  ipcMain: { handle: vi.fn() },
}));

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

describe('createProjectHandlers', () => {
  function mockDialog(): DirectoryDialog & {
    _create: ReturnType<typeof vi.fn>;
    _open: ReturnType<typeof vi.fn>;
  } {
    const pickCreateDirectory = vi.fn();
    const pickOpenDirectory = vi.fn();
    return {
      pickCreateDirectory,
      pickOpenDirectory,
      _create: pickCreateDirectory,
      _open: pickOpenDirectory,
    };
  }

  function mockRepo(): ProjectWorkspaceRepository & {
    _create: ReturnType<typeof vi.fn>;
    _open: ReturnType<typeof vi.fn>;
  } {
    const create = vi.fn();
    const open = vi.fn();
    return { create, open, _create: create, _open: open };
  }

  it('create calls pickCreateDirectory on dialog', async () => {
    const dialog = mockDialog();
    const repo = mockRepo();
    dialog._create.mockResolvedValue('/path');
    repo._create.mockResolvedValue({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test',
      rootPath: '/path',
      schemaVersion: 1 as const,
    });

    const { createProjectHandlers: createHandlers } = await import('./project-handlers.js');
    const handlers = createHandlers(dialog, repo);
    await handlers.create({ name: 'Test' });

    expect(dialog._create).toHaveBeenCalled();
  });

  it('open calls only pickOpenDirectory', async () => {
    const dialog = mockDialog();
    const repo = mockRepo();
    dialog._open.mockResolvedValue('/path');
    repo._open.mockResolvedValue({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test',
      rootPath: '/path',
      schemaVersion: 1 as const,
    });

    const { createProjectHandlers: createHandlers } = await import('./project-handlers.js');
    const handlers = createHandlers(dialog, repo);
    await handlers.open();

    expect(dialog._open).toHaveBeenCalled();
  });

  it('cancellation returns typed result', async () => {
    const dialog = mockDialog();
    const repo = mockRepo();
    dialog._create.mockResolvedValue(null);
    const rCreate = repo._create;

    const { createProjectHandlers: createHandlers } = await import('./project-handlers.js');
    const handlers = createHandlers(dialog, repo);
    const result = await handlers.create({ name: 'Test' });

    expect(result).toEqual({ status: 'cancelled' });
    expect(rCreate).not.toHaveBeenCalled();
  });

  it('validates create input and returns failed on invalid', async () => {
    const dialog = mockDialog();
    const repo = mockRepo();
    const pCreate = dialog._create;

    const { createProjectHandlers: createHandlers } = await import('./project-handlers.js');
    const handlers = createHandlers(dialog, repo);
    const result = await handlers.create({ name: '' });

    expect(result).toEqual({ status: 'failed', error: { code: 'PROJECT_NAME_INVALID' } });
    expect(pCreate).not.toHaveBeenCalled();
  });

  it('validates every result before returning', async () => {
    const dialog = mockDialog();
    const repo = mockRepo();
    dialog._create.mockResolvedValue('/path');
    repo._create.mockResolvedValue({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test',
      rootPath: '/path',
      schemaVersion: 1 as const,
    });

    const { createProjectHandlers: createHandlers } = await import('./project-handlers.js');
    const handlers = createHandlers(dialog, repo);
    const result = await handlers.create({ name: 'Test' });

    expect(result.status).toBe('created');
    if (result.status === 'created') {
      expect(result.project.projectId).toBe('550e8400-e29b-41d4-a716-446655440000');
    }
  });

  it('maps unknown errors to PROJECT_IO_FAILED', async () => {
    const dialog = mockDialog();
    const repo = mockRepo();
    dialog._create.mockResolvedValue('/path');
    repo._create.mockRejectedValue(new Error('unexpected'));

    const { createProjectHandlers: createHandlers } = await import('./project-handlers.js');
    const handlers = createHandlers(dialog, repo);
    const result = await handlers.create({ name: 'Test' });

    expect(result).toEqual({ status: 'failed', error: { code: 'PROJECT_IO_FAILED' } });
  });

  it('sets active state only after validated success', async () => {
    vi.resetModules();
    const { createProjectHandlers: createHandlers, getActiveProject } =
      await import('./project-handlers.js');

    const dialog = mockDialog();
    const repo = mockRepo();

    expect(getActiveProject()).toBeNull();

    const pCreate = dialog._create;
    const rCreate = repo._create;

    // Failed create should not set active
    const handlers = createHandlers(dialog, repo);
    await handlers.create({ name: '' });

    expect(getActiveProject()).toBeNull();

    // Successful create should set active
    pCreate.mockResolvedValue('/path');
    rCreate.mockResolvedValue({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test',
      rootPath: '/path',
      schemaVersion: 1 as const,
    });

    const result = await handlers.create({ name: 'Test' });
    expect(result.status).toBe('created');

    expect(getActiveProject()?.projectId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
});
