import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

const APP_EXE = 'knowledge-workflow-engine.exe';

function findPackageDir(outputDir: string): string {
  const entries = readdirSync(outputDir, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory() && e.name.endsWith('-win32-x64'))
    .map((e) => join(outputDir, e.name))
    .sort();
  if (dirs.length === 0) {
    throw new Error('No Windows x64 Electron package found.');
  }
  const last = dirs[dirs.length - 1];
  if (last === undefined) throw new Error('No Windows x64 Electron package found.');
  return last;
}

function findAppExecutable(packageDir: string): string {
  const exePath = join(packageDir, APP_EXE);
  if (!existsSync(exePath)) {
    throw new Error(`Application executable not found: ${APP_EXE}`);
  }
  return exePath;
}

function withTempDir(fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'kwe-pkg-test-'));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function makePkgDir(base: string, name: string): string {
  const pkg = join(base, name);
  mkdirSync(pkg, { recursive: true });
  return pkg;
}

function touch(path: string): void {
  writeFileSync(path, '', 'utf8');
}

describe('package discovery', () => {
  it('selects the application executable when it exists alongside helpers', () => {
    withTempDir((tmp) => {
      const pkg = makePkgDir(tmp, '@kwe-desktop-win32-x64');
      touch(join(pkg, APP_EXE));
      touch(join(pkg, 'chrome_crashpad_handler.exe'));

      const selected = findAppExecutable(pkg);
      expect(selected).toBe(join(pkg, APP_EXE));
    });
  });

  it('fails when only helper executables exist', () => {
    withTempDir((tmp) => {
      const pkg = makePkgDir(tmp, '@kwe-desktop-win32-x64');
      touch(join(pkg, 'chrome_crashpad_handler.exe'));

      expect(() => findAppExecutable(pkg)).toThrow('Application executable not found');
    });
  });

  it('fails when the application executable is missing entirely', () => {
    withTempDir((tmp) => {
      const pkg = makePkgDir(tmp, '@kwe-desktop-win32-x64');

      expect(() => findAppExecutable(pkg)).toThrow('Application executable not found');
    });
  });

  it('fails when no package directory exists', () => {
    withTempDir((tmp) => {
      expect(() => findPackageDir(tmp)).toThrow('No Windows x64 Electron package found');
    });
  });

  it('selects the last directory when multiple package directories exist', () => {
    withTempDir((tmp) => {
      makePkgDir(tmp, '@kwe-desktop-win32-x64');
      const second = makePkgDir(tmp, 'another-desktop-win32-x64');
      touch(join(second, APP_EXE));

      const selected = findPackageDir(tmp);
      expect(selected).toBe(second);
    });
  });
});
