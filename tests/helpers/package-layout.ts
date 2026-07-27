import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const APP_EXE = 'knowledge-workflow-engine.exe';

export function findWindowsX64PackageDirectory(outputDir: string): string {
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
  const first = dirs[0];
  if (first === undefined) {
    throw new Error('No Windows x64 Electron package directory found.');
  }
  return first;
}

export function findPackagedApplicationExecutable(packageDir: string): string {
  const exePath = join(packageDir, APP_EXE);

  if (!existsSync(exePath)) {
    throw new Error(`Application executable not found: ${APP_EXE}`);
  }
  if (!statSync(exePath).isFile()) {
    throw new Error(`Application executable path is not a regular file: ${APP_EXE}`);
  }

  return exePath;
}
