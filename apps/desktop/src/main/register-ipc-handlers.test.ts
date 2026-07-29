import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { IPC_CHANNELS } from '@kwe/contracts';
import type { DirectoryDialog, ProjectWorkspaceRepository } from '@kwe/application';

const mockIpcHandle = vi.hoisted(() => vi.fn());
const mockShowOpenDialog = vi.hoisted(() => vi.fn());

vi.mock('electron', () => ({
  dialog: { showOpenDialog: mockShowOpenDialog },
  app: {},
  BrowserWindow: vi.fn(),
  ipcMain: { handle: mockIpcHandle },
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

    const handlers = createHandlers(dialog, repo);
    await handlers.create({ name: '' });

    expect(getActiveProject()).toBeNull();

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

describe('IPC registration boundary', () => {
  function createMainWindow(): import('electron').BrowserWindow {
    const mainFrame = { url: 'kwe://renderer/index.html' };
    return { webContents: { id: 1, mainFrame } } as unknown as import('electron').BrowserWindow;
  }

  function trustedEvent(
    mainWindow: import('electron').BrowserWindow,
  ): import('electron').IpcMainInvokeEvent {
    return {
      senderFrame: (mainWindow.webContents as unknown as Record<string, unknown>).mainFrame,
      sender: mainWindow.webContents,
    } as unknown as import('electron').IpcMainInvokeEvent;
  }

  function untrustedEvent(): import('electron').IpcMainInvokeEvent {
    return {
      senderFrame: { isMainFrame: true, url: 'https://evil.com' },
      sender: { id: 999 },
    } as unknown as import('electron').IpcMainInvokeEvent;
  }

  beforeEach(() => {
    vi.resetModules();
    (globalThis as Record<string, unknown>).MAIN_WINDOW_VITE_DEV_SERVER_URL = undefined;
    (mockIpcHandle as Mock).mockClear();
    (mockShowOpenDialog as Mock).mockClear();
  });

  function getHandler(
    channel: string,
  ): ((event: unknown, ...args: unknown[]) => unknown) | undefined {
    const call: unknown[] | undefined = (mockIpcHandle as Mock).mock.calls.find(
      (args: unknown[]) => args[0] === channel,
    );
    if (call === undefined) return undefined;
    return call[1] as (event: unknown, ...args: unknown[]) => unknown;
  }

  it('registers each project channel exactly once', async () => {
    const { registerIpcHandlers } = await import('./register-ipc-handlers.js');

    registerIpcHandlers(createMainWindow());

    const channels = (mockIpcHandle as Mock).mock.calls.map((args: unknown[]) => args[0] as string);
    expect(channels.filter((ch: string) => ch === 'project:create')).toHaveLength(1);
    expect(channels.filter((ch: string) => ch === 'project:open')).toHaveLength(1);
    expect(channels.filter((ch: string) => ch === 'project:get-active')).toHaveLength(1);
  });

  it('project:create rejects untrusted sender', async () => {
    const { registerIpcHandlers } = await import('./register-ipc-handlers.js');

    registerIpcHandlers(createMainWindow());

    const handler = getHandler('project:create')!;
    await expect(
      Promise.resolve().then(() => handler(untrustedEvent(), { name: 'x' })),
    ).rejects.toThrow('Unauthorized application request.');
  });

  it('project:open rejects untrusted sender', async () => {
    const { registerIpcHandlers } = await import('./register-ipc-handlers.js');

    registerIpcHandlers(createMainWindow());

    const handler = getHandler('project:open')!;
    await expect(Promise.resolve().then(() => handler(untrustedEvent()))).rejects.toThrow(
      'Unauthorized application request.',
    );
  });

  it('project:get-active rejects untrusted sender', async () => {
    const { registerIpcHandlers } = await import('./register-ipc-handlers.js');

    registerIpcHandlers(createMainWindow());

    const handler = getHandler('project:get-active')!;
    await expect(Promise.resolve().then(() => handler(untrustedEvent()))).rejects.toThrow(
      'Unauthorized application request.',
    );
  });

  it('project:create validates input through IPC boundary', async () => {
    const { registerIpcHandlers } = await import('./register-ipc-handlers.js');

    const mainWindow = createMainWindow();
    registerIpcHandlers(mainWindow);

    const handler = getHandler('project:create')!;
    const result = (await handler(trustedEvent(mainWindow), { name: '' })) as Record<
      string,
      unknown
    >;

    expect(result).toEqual({ status: 'failed', error: { code: 'PROJECT_NAME_INVALID' } });
  });

  it('project:create succeeds through full IPC boundary', async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'kwe-ipc-'));
    (mockShowOpenDialog as Mock).mockResolvedValue({ canceled: false, filePaths: [tmpDir] });

    const { registerIpcHandlers } = await import('./register-ipc-handlers.js');

    const mainWindow = createMainWindow();
    registerIpcHandlers(mainWindow);

    const handler = getHandler('project:create')!;
    const result = (await handler(trustedEvent(mainWindow), { name: 'IPC Test' })) as {
      status: string;
      project?: { name: string };
    };

    try {
      expect(result.status).toBe('created');
      if (result.status === 'created') {
        expect(result.project!.name).toBe('IPC Test');
      }
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('project:get-active returns null before any project is active', async () => {
    const { registerIpcHandlers } = await import('./register-ipc-handlers.js');

    const mainWindow = createMainWindow();
    registerIpcHandlers(mainWindow);

    const handler = getHandler('project:get-active')!;
    const result = await handler(trustedEvent(mainWindow));
    expect(result).toBeNull();
  });
});
