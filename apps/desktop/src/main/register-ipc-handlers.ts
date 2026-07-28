import { app, BrowserWindow, ipcMain } from 'electron';

import { IPC_CHANNELS } from '@kwe/contracts';

import { createGetAppInfoHandler } from './app-info-handler.js';
import { getNavigationMode, isTrustedIpcSender } from './navigation-policy.js';
import { createComputeDiagnosticHashHandler } from './utility-process-coordinator.js';

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  const getAppInfo = createGetAppInfoHandler(() => app.getVersion());
  const navigationMode = getNavigationMode(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  const computeDiagnosticHash = createComputeDiagnosticHashHandler();

  const assertTrustedSender = (event: Electron.IpcMainInvokeEvent): void => {
    const senderFrame = event.senderFrame;
    const sender =
      senderFrame === null
        ? undefined
        : {
            isMainFrame: senderFrame === event.sender.mainFrame,
            url: senderFrame.url,
          };

    if (event.sender !== mainWindow.webContents || !isTrustedIpcSender(sender, navigationMode)) {
      throw new Error('Unauthorized application request.');
    }
  };

  ipcMain.handle(IPC_CHANNELS.appGetInfo, (event, input: unknown) => {
    assertTrustedSender(event);
    return getAppInfo(input);
  });

  ipcMain.handle(IPC_CHANNELS.systemComputeDiagnosticHash, (event, input: unknown) => {
    assertTrustedSender(event);
    return computeDiagnosticHash(input);
  });
}
