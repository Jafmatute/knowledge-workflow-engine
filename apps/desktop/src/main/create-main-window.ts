import { join } from 'node:path';

import { BrowserWindow, session, type BrowserWindowConstructorOptions } from 'electron';

import {
  getApplicationDocumentUrl,
  getNavigationMode,
  isAllowedApplicationNavigation,
} from './navigation-policy.js';

export function getMainWindowOptions(preloadPath: string): BrowserWindowConstructorOptions {
  return {
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    titleBarStyle: 'default',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
      experimentalFeatures: false,
      preload: preloadPath,
    },
  };
}

export async function createMainWindow(): Promise<BrowserWindow> {
  const mainWindow = new BrowserWindow(getMainWindowOptions(join(__dirname, 'preload.cjs')));
  const navigationMode = getNavigationMode(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  const applicationDocumentUrl = getApplicationDocumentUrl(navigationMode);

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    if (!isAllowedApplicationNavigation(navigationUrl, navigationMode)) {
      event.preventDefault();
    }
  });

  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  await mainWindow.loadURL(applicationDocumentUrl);

  return mainWindow;
}
