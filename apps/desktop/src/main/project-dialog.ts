import { dialog, type BrowserWindow } from 'electron';

import type { DirectoryDialog } from '@kwe/application';

export function createElectronDirectoryDialog(mainWindow: BrowserWindow): DirectoryDialog {
  return {
    async pickDirectory(): Promise<string | null> {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const selectedPath = result.filePaths[0];
      return selectedPath ?? null;
    },
  };
}
