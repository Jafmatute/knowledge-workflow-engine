/**
 * @file Shared package-layout helper for S01 packaged verification.
 * This file is plain ESM JavaScript so it can be imported by both
 * scripts/verify-package.mjs and tests (TypeScript via Vitest/Playwright).
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** @type {string} */
export const APP_EXE = 'knowledge-workflow-engine.exe';

/**
 * Find the one Windows x64 package directory under `outputDir`.
 * @param {string} outputDir
 * @returns {string}
 */
export function findWindowsX64PackageDirectory(outputDir) {
  const entries = readdirSync(outputDir, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory() && e.name.endsWith('-win32-x64'))
    .map((e) => join(outputDir, e.name));

  if (dirs.length === 0) {
    throw new Error('No Windows x64 Electron package directory found.');
  }
  if (dirs.length > 1) {
    throw new Error('Multiple Windows x64 package directories found. Expected exactly one.');
  }
  return dirs[0];
}

/**
 * Given a validated package directory, return the path to the application
 * executable.  Must exist, be a regular file, and match APP_EXE.
 * @param {string} packageDir
 * @returns {string}
 */
export function findPackagedApplicationExecutable(packageDir) {
  const exePath = join(packageDir, APP_EXE);

  if (!existsSync(exePath)) {
    throw new Error(`Application executable not found: ${APP_EXE}`);
  }
  if (!statSync(exePath).isFile()) {
    throw new Error(`Application executable path is not a regular file: ${APP_EXE}`);
  }

  return exePath;
}
