import { join } from 'node:path';

import { BrowserWindow, session, type BrowserWindowConstructorOptions } from 'electron';

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
  const allowedUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL ?? 'kwe://renderer/index.html';

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    if (!navigationUrl.startsWith(allowedUrl)) {
      event.preventDefault();
    }
  });

  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadURL(allowedUrl);
  }

  return mainWindow;
}
