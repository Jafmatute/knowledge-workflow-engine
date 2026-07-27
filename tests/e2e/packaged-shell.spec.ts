import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { chromium, expect, test } from '@playwright/test';

function findPackagedExecutable(): string {
  const outputDirectory = join(process.cwd(), 'apps', 'desktop', 'out');
  const packageDirectory = readdirSync(outputDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('-win32-x64'))
    .map((entry) => join(outputDirectory, entry.name))
    .sort()
    .at(-1);

  if (packageDirectory === undefined) {
    throw new Error('No packaged Electron application is available for E2E testing.');
  }

  const executable = readdirSync(packageDirectory, { withFileTypes: true }).find(
    (entry) => entry.isFile() && entry.name.endsWith('.exe'),
  );

  if (executable === undefined) {
    throw new Error('The packaged Electron application executable is unavailable for E2E testing.');
  }

  return join(packageDirectory, executable.name);
}

async function connectToPackagedApplication() {
  const port = 10_000 + Math.floor(Math.random() * 10_000);
  const application = spawn(findPackagedExecutable(), [`--remote-debugging-port=${port}`], {
    stdio: 'ignore',
  });

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      return { application, browser: await chromium.connectOverCDP(`http://127.0.0.1:${port}`) };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  application.kill();
  throw new Error('The packaged Electron application did not expose its debugging endpoint.');
}

test('runs the packaged shell and verifies the utility process', async () => {
  const { application, browser } = await connectToPackagedApplication();
  try {
    const window = browser.contexts()[0]?.pages()[0];

    if (window === undefined) {
      throw new Error('The packaged Electron application did not open a window.');
    }

    await expect(window.getByRole('heading', { name: 'Secure desktop shell ready' })).toBeVisible();
    await expect(window.getByText('Application version: 0.1.0')).toBeVisible();
    await window.getByRole('button', { name: 'Verify utility process' }).click();
    await expect(window.getByText('Utility process: Ready')).toBeVisible();
  } finally {
    await browser.close();
    application.kill();
  }
});
