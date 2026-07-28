import { describe, expect, it } from 'vitest';

import { getMainWindowOptions } from './create-main-window.js';

describe('main window options', () => {
  it('keeps the renderer isolated from privileged APIs', () => {
    const options = getMainWindowOptions('preload.js');

    expect(options.webPreferences?.nodeIntegration).toBe(false);
    expect(options.webPreferences?.contextIsolation).toBe(true);
    expect(options.webPreferences?.sandbox).toBe(true);
    expect(options.webPreferences?.webSecurity).not.toBe(false);
  });
});
