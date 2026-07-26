import { app, ipcMain } from 'electron';

import { IPC_CHANNELS } from '@kwe/contracts';

import { createGetAppInfoHandler } from './app-info-handler.js';

export function registerIpcHandlers(): void {
  const getAppInfo = createGetAppInfoHandler(() => app.getVersion());

  ipcMain.handle(IPC_CHANNELS.appGetInfo, (_event, input: unknown) => getAppInfo(input));
}
