import { app } from 'electron';

import { createMainWindow } from './create-main-window.js';
import { registerApplicationProtocol, registerApplicationScheme } from './register-app-protocol.js';
import { registerIpcHandlers } from './register-ipc-handlers.js';

registerApplicationScheme();

void app.whenReady().then(async () => {
  registerApplicationProtocol();
  registerIpcHandlers();
  await createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
