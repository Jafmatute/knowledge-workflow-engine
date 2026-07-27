import { spawn } from 'node:child_process';
import { createServer, type AddressInfo } from 'node:net';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { chromium, expect, test, type Page } from '@playwright/test';

function findPackagedExecutable(): string {
  const outputDirectory = join(process.cwd(), 'apps', 'desktop', 'out');
  const directory = readdirSync(outputDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('-win32-x64'))
    .map((entry) => join(outputDirectory, entry.name))
    .sort()
    .at(-1);

  if (directory === undefined) {
    throw new Error('No packaged Electron application is available for E2E testing.');
  }

  const executable = readdirSync(directory, { withFileTypes: true }).find(
    (entry) => entry.isFile() && entry.name.endsWith('.exe'),
  );

  if (executable === undefined) {
    throw new Error('The packaged Electron application executable is unavailable for E2E testing.');
  }

  return join(directory, executable.name);
}

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

async function connectToPackagedApplication() {
  const port = await findFreePort();
  const application = spawn(findPackagedExecutable(), [`--remote-debugging-port=${port}`], {
    stdio: 'ignore',
  });

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
      return { application, browser };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  application.kill();
  throw new Error('The packaged Electron application did not expose its debugging endpoint.');
}

function getWindow(browser: Awaited<ReturnType<typeof chromium.connectOverCDP>>): Page {
  const context = browser.contexts()[0];
  if (context === undefined) throw new Error('No browser context.');
  const window = context.pages()[0];
  if (window === undefined) throw new Error('No page.');
  return window;
}

test('verifies the complete S01 security surface of the packaged shell', async () => {
  const { application, browser } = await connectToPackagedApplication();
  let exitCode: number | null = null;
  application.on('exit', (code: number | null) => {
    exitCode = code;
  });

  try {
    const window = getWindow(browser);

    // Exactly one application window
    expect(browser.contexts()).toHaveLength(1);
    const context = browser.contexts()[0];
    expect(context!.pages()).toHaveLength(1);

    // Heading and version
    await expect(window.getByRole('heading', { name: 'Secure desktop shell ready' })).toBeVisible();
    await expect(window.getByText('Application version: 0.1.0')).toBeVisible();

    // Utility diagnostic reaches ready
    await window.getByRole('button', { name: 'Verify utility process' }).click();
    await expect(window.getByText('Utility process: Ready')).toBeVisible();

    // No Node globals in the renderer
    const hasRequire = await window.evaluate('typeof window.require');
    expect(hasRequire).toBe('undefined');
    const hasProcess = await window.evaluate('typeof window.process');
    expect(hasProcess).toBe('undefined');

    // window.kwe surface is exactly app and system
    const kweKeys = await window.evaluate('Object.keys(window.kwe)');
    expect(kweKeys).toEqual(['app', 'system']);

    // app exposes only getInfo
    const appKeys = await window.evaluate('Object.keys(window.kwe.app)');
    expect(appKeys).toEqual(['getInfo']);

    // system exposes only computeDiagnosticHash
    const systemKeys = await window.evaluate('Object.keys(window.kwe.system)');
    expect(systemKeys).toEqual(['computeDiagnosticHash']);

    // A popup attempt does not create another page
    const pagesBefore = context!.pages().length;
    await window.evaluate('window.open("about:blank","_blank")');
    expect(context!.pages()).toHaveLength(pagesBefore);

    // An external navigation attempt does not replace the document
    const currentUrl = window.url();
    await window.evaluate('window.location.href="https://example.com"');
    await expect(window).toHaveURL(currentUrl);

    // Close cleanly
    await window.close();
    await expect.poll(() => exitCode, { timeout: 5_000 }).toBe(0);
  } finally {
    await browser.close();
    application.kill();
  }
});
