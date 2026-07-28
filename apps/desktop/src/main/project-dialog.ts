import { dialog, type BrowserWindow } from 'electron';

import type { DirectoryDialog } from '@kwe/application';

export function createElectronDirectoryDialog(mainWindow: BrowserWindow): DirectoryDialog {
  return {
    async pickCreateDirectory(): Promise<string | null> {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
      });

      if (result.canceled || result.filePaths.length !== 1) {
        return null;
      }

      return result.filePaths[0] ?? null;
    },

    async pickOpenDirectory(): Promise<string | null> {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
      });

      if (result.canceled || result.filePaths.length !== 1) {
        return null;
      }

      return result.filePaths[0] ?? null;
    },
  };
}
