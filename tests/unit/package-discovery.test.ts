import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import {
  APP_EXE,
  findPackagedApplicationExecutable,
  findWindowsX64PackageDirectory,
} from '../helpers/package-layout.js';

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

      const selected = findPackagedApplicationExecutable(pkg);
      expect(selected).toBe(join(pkg, APP_EXE));
    });
  });

  it('fails when only helper executables exist', () => {
    withTempDir((tmp) => {
      const pkg = makePkgDir(tmp, '@kwe-desktop-win32-x64');
      touch(join(pkg, 'chrome_crashpad_handler.exe'));

      expect(() => findPackagedApplicationExecutable(pkg)).toThrow(
        'Application executable not found',
      );
    });
  });

  it('fails when the application executable path is a directory', () => {
    withTempDir((tmp) => {
      const pkg = makePkgDir(tmp, '@kwe-desktop-win32-x64');
      mkdirSync(join(pkg, APP_EXE));

      expect(() => findPackagedApplicationExecutable(pkg)).toThrow('not a regular file');
    });
  });

  it('fails when no package directory exists', () => {
    withTempDir((tmp) => {
      expect(() => findWindowsX64PackageDirectory(tmp)).toThrow(
        'No Windows x64 Electron package directory found',
      );
    });
  });

  it('fails when multiple matching package directories exist', () => {
    withTempDir((tmp) => {
      makePkgDir(tmp, 'first-win32-x64');
      makePkgDir(tmp, 'second-win32-x64');

      expect(() => findWindowsX64PackageDirectory(tmp)).toThrow(
        'Multiple Windows x64 package directories found',
      );
    });
  });

  it('selects the single valid package among nonmatching directories', () => {
    withTempDir((tmp) => {
      makePkgDir(tmp, 'some-other-dir');
      const valid = makePkgDir(tmp, 'knowledge-workflow-engine-win32-x64');
      touch(join(valid, APP_EXE));

      const selected = findWindowsX64PackageDirectory(tmp);
      expect(selected).toBe(valid);
    });
  });
});
