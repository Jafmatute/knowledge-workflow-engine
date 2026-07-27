import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type AddressInfo } from 'node:net';
import { join } from 'node:path';

import { chromium, expect, test, type Page } from '@playwright/test';

import {
  findPackagedApplicationExecutable,
  findWindowsX64PackageDirectory,
} from '../../scripts/package-layout.mjs';

const OUTPUT_DIR = join(process.cwd(), 'apps', 'desktop', 'out');
const STARTUP_DEADLINE_MS = 15_000;
const CDP_POLL_INTERVAL_MS = 200;
const TRUSTED_PAGE_URL = 'kwe://renderer/index.html';

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

async function waitForTrustedPage(
  browser: Awaited<ReturnType<typeof chromium.connectOverCDP>>,
): Promise<Page> {
  const deadline = Date.now() + STARTUP_DEADLINE_MS;

  while (Date.now() < deadline) {
    for (const context of browser.contexts()) {
      for (const page of context.pages()) {
        const url = page.url();
        if (url === TRUSTED_PAGE_URL) {
          return page;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, CDP_POLL_INTERVAL_MS));
  }

  // Diagnostics
  const diagnostics: string[] = [];
  for (const ctx of browser.contexts()) {
    for (const p of ctx.pages()) {
      diagnostics.push(`${p.url()} (context ${browser.contexts().indexOf(ctx)})`);
    }
  }
  throw new Error(
    `Trusted page did not appear. Pages found: ${diagnostics.length > 0 ? diagnostics.join('; ') : 'none'}`,
  );
}

test('verifies the complete S01 security surface of the packaged shell', async () => {
  const port = await findFreePort();
  const stderrChunks: Buffer[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedKweRequests: string[] = [];

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

    const window = await waitForTrustedPage(browser);

    // Collect diagnostics
    window.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text().slice(0, 500));
      }
    });
    window.on('pageerror', (err) => {
      pageErrors.push(err.message.slice(0, 500));
    });
    window.on('requestfailed', (request) => {
      if (request.url().startsWith('kwe://')) {
        failedKweRequests.push(`${request.url()} — ${request.failure()?.errorText ?? 'unknown'}`);
      }
    });

    // Exactly one application context and one page
    expect(browser.contexts()).toHaveLength(1);
    const context = browser.contexts()[0];
    expect(context!.pages()).toHaveLength(1);

    // Trusted URL
    expect(window.url()).toBe(TRUSTED_PAGE_URL);

    // Heading and version
    await expect(window.getByRole('heading', { name: 'Secure desktop shell ready' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(window.getByText('Application version: 0.1.0')).toBeVisible();

    // Utility diagnostic reaches ready
    await window.getByRole('button', { name: 'Verify utility process' }).click();
    await expect(window.getByText('Utility process: Ready')).toBeVisible();

    // Assert no failed kwe: asset requests
    if (failedKweRequests.length > 0) {
      throw new Error(`Failed kwe:// requests: ${failedKweRequests.join('; ')}`);
    }

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
    try {
      await window.evaluate('window.location.href="https://example.com"');
    } catch {
      // Navigation rejected immediately; expected.
    }
    await expect
      .poll(() => window.url(), { timeout: 5_000 })
      .toBe(currentUrl);

    // Close cleanly
    await window.close();
    await expect.poll(() => exitCode, { timeout: 5_000 }).toBe(0);
  } finally {
    if (browser !== undefined) await browser.close();
    application.kill();
  }
});
