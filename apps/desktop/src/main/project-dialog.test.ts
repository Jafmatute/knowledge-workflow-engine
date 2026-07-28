import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockShowOpenDialog = vi.hoisted(() => vi.fn());

vi.mock('electron', () => ({
  dialog: { showOpenDialog: mockShowOpenDialog },
  app: {},
  BrowserWindow: vi.fn(),
  ipcMain: { handle: vi.fn() },
}));

const mainWindow = { id: 1 } as Record<string, unknown>;

async function createDialog() {
  const { createElectronDirectoryDialog } = await import('./project-dialog.js');
  return createElectronDirectoryDialog(mainWindow as never);
}

describe('createElectronDirectoryDialog', () => {
  beforeEach(() => {
    mockShowOpenDialog.mockReset();
    mockShowOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['/path'] });
  });

  it('create uses openDirectory + createDirectory', async () => {
    const dirDialog = await createDialog();
    await dirDialog.pickCreateDirectory();
    expect(mockShowOpenDialog).toHaveBeenCalledWith(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
    });
  });

  it('open uses only openDirectory', async () => {
    const dirDialog = await createDialog();
    await dirDialog.pickOpenDirectory();
    expect(mockShowOpenDialog).toHaveBeenCalledWith(mainWindow, {
      properties: ['openDirectory'],
    });
  });

  it('canceled returns null', async () => {
    mockShowOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });
    const dirDialog = await createDialog();
    expect(await dirDialog.pickCreateDirectory()).toBeNull();
    expect(await dirDialog.pickOpenDirectory()).toBeNull();
  });

  it('zero paths returns null', async () => {
    mockShowOpenDialog.mockResolvedValue({ canceled: false, filePaths: [] });
    const dirDialog = await createDialog();
    expect(await dirDialog.pickCreateDirectory()).toBeNull();
  });

  it('exactly one path returns that path', async () => {
    mockShowOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['/selected'] });
    const dirDialog = await createDialog();
    expect(await dirDialog.pickCreateDirectory()).toBe('/selected');
  });

  it('more than one path returns null', async () => {
    mockShowOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['/a', '/b'] });
    const dirDialog = await createDialog();
    expect(await dirDialog.pickCreateDirectory()).toBeNull();
  });
});
