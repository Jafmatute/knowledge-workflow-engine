import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type AddressInfo } from 'node:net';
import { join } from 'node:path';

import { chromium, expect, test, type Page } from '@playwright/test';

import {
  findPackagedApplicationExecutable,
  findWindowsX64PackageDirectory,
} from '../helpers/package-layout.js';

const OUTPUT_DIR = join(process.cwd(), 'apps', 'desktop', 'out');
const STARTUP_DEADLINE_MS = 15_000;
const CDP_POLL_INTERVAL_MS = 200;
const TRUSTED_PAGE_URL_PREFIX = 'kwe://renderer/';

test.setTimeout(60_000);

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

async function waitForChildPage(
  browser: Awaited<ReturnType<typeof chromium.connectOverCDP>>,
): Promise<Page> {
  const deadline = Date.now() + STARTUP_DEADLINE_MS;

  while (Date.now() < deadline) {
    const contexts = browser.contexts();
    if (contexts.length >= 1) {
      const pages = contexts[0]!.pages();
      if (pages.length >= 1) {
        const page = pages[0]!;
        const url = page.url();
        if (url.startsWith(TRUSTED_PAGE_URL_PREFIX)) {
          return page;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, CDP_POLL_INTERVAL_MS));
  }

  // One last check for diagnostics
  const contexts = browser.contexts();
  if (contexts.length === 0) throw new Error('No browser context appeared.');
  const pages = contexts[0]!.pages();
  if (pages.length === 0) throw new Error('No page appeared.');
  const url = pages[0]!.url();
  throw new Error(`Trusted page did not appear. Page URL: ${url}`);
}

test('verifies the complete S01 security surface of the packaged shell', async () => {
  const port = await findFreePort();
  const stderrChunks: Buffer[] = [];

  const application: ChildProcess = spawn(
    findPackagedApplicationExecutable(findWindowsX64PackageDirectory(OUTPUT_DIR)),
    [`--remote-debugging-port=${port}`],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );

  application.stderr?.on('data', (chunk: Buffer) => {
    stderrChunks.push(chunk);
  });

  let exitCode: number | null = null;
  application.on('exit', (code: number | null) => {
    exitCode = code;
  });

  const deadline = Date.now() + STARTUP_DEADLINE_MS;
  let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | undefined;

  try {
    while (Date.now() < deadline) {
      if (exitCode !== null) {
        const stderr = Buffer.concat(stderrChunks).toString('utf8').slice(0, 2048);
        throw new Error(
          `Application exited with code ${String(exitCode)} before CDP connection.${stderr ? ` stderr: ${stderr}` : ''}`,
        );
      }
      try {
        browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, CDP_POLL_INTERVAL_MS));
      }
    }

    if (browser === undefined) {
      application.kill();
      const stderr = Buffer.concat(stderrChunks).toString('utf8').slice(0, 2048);
      throw new Error(
        `Application did not expose CDP within ${STARTUP_DEADLINE_MS}ms.${stderr ? ` stderr: ${stderr}` : ''}`,
      );
    }

    // Wait for the trusted application page
    const window = await waitForChildPage(browser);

    // Exactly one application context and one page
    expect(browser.contexts()).toHaveLength(1);
    const context = browser.contexts()[0];
    expect(context!.pages()).toHaveLength(1);

    // Heading and version
    await expect(window.getByRole('heading', { name: 'Secure desktop shell ready' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(window.getByText('Application version: 0.1.0')).toBeVisible();

    // Utility diagnostic reaches ready
    await window.getByRole('button', { name: 'Verify utility process' }).click();
    await expect(window.getByText('Utility process: Ready')).toBeVisible();

    // No Node globals in the renderer
    expect(await window.evaluate('typeof window.require')).toBe('undefined');
    expect(await window.evaluate('typeof window.process')).toBe('undefined');

    // window.kwe surface is exactly app and system
    expect(await window.evaluate('Object.keys(window.kwe)')).toEqual(['app', 'system']);

    // app exposes only getInfo
    expect(await window.evaluate('Object.keys(window.kwe.app)')).toEqual(['getInfo']);

    // system exposes only computeDiagnosticHash
    expect(await window.evaluate('Object.keys(window.kwe.system)')).toEqual([
      'computeDiagnosticHash',
    ]);

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
    if (browser !== undefined) await browser.close();
    application.kill();
  }
});
