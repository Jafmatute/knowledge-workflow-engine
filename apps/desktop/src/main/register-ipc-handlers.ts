import { app, BrowserWindow, ipcMain } from 'electron';

import { IPC_CHANNELS } from '@kwe/contracts';
import { createNodeProjectWorkspaceRepository } from '@kwe/infrastructure';
import { activeProjectDtoSchema } from '@kwe/schemas';

import { createGetAppInfoHandler } from './app-info-handler.js';
import { getNavigationMode, isTrustedIpcSender } from './navigation-policy.js';
import {
  createElectronDirectoryDialog,
  createProjectHandlers,
  getActiveProject,
} from './project-handlers.js';
import { createComputeDiagnosticHashHandler } from './utility-process-coordinator.js';

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  const getAppInfo = createGetAppInfoHandler(() => app.getVersion());
  const navigationMode = getNavigationMode(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  const computeDiagnosticHash = createComputeDiagnosticHashHandler();

  const directoryDialog = createElectronDirectoryDialog(mainWindow);
  const workspaceRepo = createNodeProjectWorkspaceRepository();
  const projectHandlers = createProjectHandlers(directoryDialog, workspaceRepo);

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

  ipcMain.handle(IPC_CHANNELS.projectCreate, async (event, input: unknown) => {
    assertTrustedSender(event);
    return await projectHandlers.create(input);
  });

  ipcMain.handle(IPC_CHANNELS.projectOpen, async (event) => {
    assertTrustedSender(event);
    return await projectHandlers.open();
  });

  ipcMain.handle(IPC_CHANNELS.projectGetActive, (event) => {
    assertTrustedSender(event);
    const active = getActiveProject();
    const parsed = activeProjectDtoSchema.safeParse(active);
    return parsed.success ? parsed.data : null;
  });
}
