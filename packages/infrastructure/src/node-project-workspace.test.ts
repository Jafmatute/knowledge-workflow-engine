import { existsSync, rmSync, writeSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, readFile, realpath, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createNodeProjectWorkspaceRepository,
  type AtomicFileSystem,
  defaultAtomicFs,
} from './node-project-workspace.js';
import { ProjectWorkspaceError } from '@kwe/application';

let symlinkSupported: boolean;

try {
  const tmpDir = await mkdtemp(join(tmpdir(), 'kwe-sl-'));
  const src = join(tmpDir, 'src');
  await mkdir(src);
  await symlink(src, join(tmpDir, 'dst'), 'dir');
  symlinkSupported = true;
  rmSync(tmpDir, { recursive: true, force: true });
} catch {
  symlinkSupported = false;
}

const symlinkIt = symlinkSupported ? it : it.skip;

interface FsOpRecorder {
  ops: string[];
  failOn: string[];
}

function createMockFs(): [AtomicFileSystem, FsOpRecorder] {
  const recorder: FsOpRecorder = { ops: [], failOn: [] };
  const files = new Map<string, Buffer>();
  let nextFd = 0;

  const mockFs: AtomicFileSystem = {
    openWriteExclusive(path: string): number {
      recorder.ops.push(`open:${path}`);
      if (recorder.failOn.includes('open')) {
        throw Object.assign(new Error(`open failed for ${path}`), { code: 'EACCES' });
      }
      const fd = ++nextFd;
      files.set(String(fd), Buffer.alloc(0));
      return fd;
    },
    writeAll(fd: number, buffer: Buffer): void {
      recorder.ops.push(`write:${fd}:${buffer.length}`);
      if (recorder.failOn.includes('write')) {
        throw new Error('write failed');
      }
      const existing = files.get(String(fd));
      if (existing) {
        files.set(String(fd), Buffer.concat([existing, buffer]));
      }
    },
    sync(fd: number): void {
      recorder.ops.push(`sync:${fd}`);
      if (recorder.failOn.includes('sync')) {
        throw new Error('sync failed');
      }
    },
    close(fd: number): void {
      recorder.ops.push(`close:${fd}`);
      if (recorder.failOn.includes('close')) {
        throw new Error('close failed');
      }
      files.delete(String(fd));
    },
    link(src: string, dest: string): void {
      recorder.ops.push(`link:${src}->${dest}`);
      if (recorder.failOn.includes('link')) {
        throw Object.assign(new Error('link failed'), { code: 'EEXIST' });
      }
      if (recorder.failOn.includes('link-other')) {
        throw Object.assign(new Error('link failed'), { code: 'EACCES' });
      }
    },
    unlink(path: string): void {
      recorder.ops.push(`unlink:${path}`);
      if (recorder.failOn.includes('unlink')) {
        throw Object.assign(new Error('unlink failed'), { code: 'EACCES' });
      }
    },
  };

  return [mockFs, recorder];
}

describe('Node project workspace repository', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'kwe-test-'));
  });

  afterEach(() => {
    rmSync(tmpBase, { recursive: true, force: true });
  });

  const repo = createNodeProjectWorkspaceRepository();

  it('creates .kwe/project.json with valid content, ends with newline, canonical root', async () => {
    const project = await repo.create('Test Project', tmpBase);

    expect(project.name).toBe('Test Project');
    expect(project.schemaVersion).toBe(1);

    const canonical = await realpath(tmpBase);
    expect(project.rootPath).toBe(canonical);

    const manifestPath = join(tmpBase, '.kwe', 'project.json');
    const content = await readFile(manifestPath, 'utf-8');

    expect(content).toContain('"schemaVersion": 1');
    expect(content).toContain('"projectId"');
    expect(content).toContain('"name": "Test Project"');
    expect(content).toContain('"createdAt"');
    expect(content).toContain('"updatedAt"');
    expect(content.endsWith('\n')).toBe(true);
  });

  it('does not include rootPath in manifest', async () => {
    await repo.create('Test Project', tmpBase);

    const manifestPath = join(tmpBase, '.kwe', 'project.json');
    const content = await readFile(manifestPath, 'utf-8');

    expect(content).not.toContain('rootPath');
  });

  it('rejects existing manifest (PROJECT_ALREADY_EXISTS)', async () => {
    await repo.create('First', tmpBase);

    const err = await repo.create('Second', tmpBase).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);
    expect((err as ProjectWorkspaceError).code).toBe('PROJECT_ALREADY_EXISTS');
  });

  it('opens a valid project', async () => {
    const created = await repo.create('Test Project', tmpBase);
    const opened = await repo.open(tmpBase);

    expect(opened.projectId).toBe(created.projectId);
    expect(opened.name).toBe('Test Project');

    const canonical = await realpath(tmpBase);
    expect(opened.rootPath).toBe(canonical);
  });

  it('rejects missing .kwe (PROJECT_MANIFEST_NOT_FOUND)', async () => {
    const err = await repo.open(tmpBase).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);
    expect((err as ProjectWorkspaceError).code).toBe('PROJECT_MANIFEST_NOT_FOUND');
  });

  it('rejects malformed JSON manifest (PROJECT_MANIFEST_INVALID)', async () => {
    await mkdir(join(tmpBase, '.kwe'), { recursive: true });
    await writeFile(join(tmpBase, '.kwe', 'project.json'), '{ invalid json }', 'utf-8');

    const err = await repo.open(tmpBase).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);
    expect((err as ProjectWorkspaceError).code).toBe('PROJECT_MANIFEST_INVALID');
  });

  it('rejects unknown manifest fields (PROJECT_MANIFEST_INVALID)', async () => {
    await mkdir(join(tmpBase, '.kwe'), { recursive: true });
    await writeFile(
      join(tmpBase, '.kwe', 'project.json'),
      JSON.stringify({
        schemaVersion: 1,
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
        createdAt: '2026-07-27T12:00:00.000Z',
        updatedAt: '2026-07-27T12:00:00.000Z',
        extra: true,
      }),
      'utf-8',
    );

    const err = await repo.open(tmpBase).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);
    expect((err as ProjectWorkspaceError).code).toBe('PROJECT_MANIFEST_INVALID');
  });

  it('rejects unsupported schema version (PROJECT_VERSION_UNSUPPORTED)', async () => {
    await mkdir(join(tmpBase, '.kwe'), { recursive: true });
    await writeFile(
      join(tmpBase, '.kwe', 'project.json'),
      JSON.stringify({
        schemaVersion: 2,
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
        createdAt: '2026-07-27T12:00:00.000Z',
        updatedAt: '2026-07-27T12:00:00.000Z',
      }),
      'utf-8',
    );

    const err = await repo.open(tmpBase).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);
    expect((err as ProjectWorkspaceError).code).toBe('PROJECT_VERSION_UNSUPPORTED');
  });

  it('rejects oversized manifest (PROJECT_MANIFEST_INVALID)', async () => {
    await mkdir(join(tmpBase, '.kwe'), { recursive: true });
    await writeFile(join(tmpBase, '.kwe', 'project.json'), 'x'.repeat(65_537), 'utf-8');

    const err = await repo.open(tmpBase).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);
    expect((err as ProjectWorkspaceError).code).toBe('PROJECT_MANIFEST_INVALID');
  });

  it('rejects non-file manifest path (PROJECT_MANIFEST_INVALID)', async () => {
    await mkdir(join(tmpBase, '.kwe', 'project.json'), { recursive: true });

    const err = await repo.open(tmpBase).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);
    expect((err as ProjectWorkspaceError).code).toBe('PROJECT_MANIFEST_INVALID');
  });

  it('rejects nonexistent root directory (PROJECT_PATH_INVALID)', async () => {
    const missing = join(tmpBase, 'does-not-exist');

    const err = await repo.create('Test', missing).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);
    expect((err as ProjectWorkspaceError).code).toBe('PROJECT_PATH_INVALID');
  });

  it('does not delete unrelated files', async () => {
    const unrelatedPath = join(tmpBase, 'important.txt');
    await writeFile(unrelatedPath, 'keep me', 'utf-8');

    await repo.create('Test', tmpBase);

    expect(existsSync(unrelatedPath)).toBe(true);
  });

  it('leaves no .tmp.* files after create', async () => {
    await repo.create('Test Project', tmpBase);

    const kweContents = await readdir(join(tmpBase, '.kwe'));
    const tmpFiles = kweContents.filter((f: string) => f.startsWith('.tmp.'));
    expect(tmpFiles).toHaveLength(0);
  });

  symlinkIt('accepts root symlink (canonicalizes it)', async () => {
    const realDir = join(tmpBase, 'realdir');
    const linkDir = join(tmpBase, 'linkdir');
    await mkdir(realDir);

    await symlink(realDir, linkDir, 'dir');

    const project = await repo.create('Test', linkDir);
    const canonical = await realpath(realDir);
    expect(project.rootPath).toBe(canonical);
  });

  symlinkIt('rejects .kwe symlink (PROJECT_PATH_INVALID)', async () => {
    const realKwe = join(tmpBase, 'real-kwe');
    const kweDir = join(tmpBase, '.kwe');
    await mkdir(realKwe);

    await symlink(realKwe, kweDir, 'dir');

    const err = await repo.create('Test', tmpBase).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);
    expect((err as ProjectWorkspaceError).code).toBe('PROJECT_PATH_INVALID');
  });

  symlinkIt('rejects project.json symlink (PROJECT_PATH_INVALID)', async () => {
    const kweDir = join(tmpBase, '.kwe');
    const manifestPath = join(kweDir, 'project.json');
    await mkdir(kweDir);
    await writeFile(join(tmpBase, 'real-manifest.json'), '{}', 'utf-8');

    await symlink(join(tmpBase, 'real-manifest.json'), manifestPath, 'file');

    const err = await repo.create('Test', tmpBase).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);
    expect((err as ProjectWorkspaceError).code).toBe('PROJECT_PATH_INVALID');
  });

  it('exclusive publication race: first succeeds, second PROJECT_ALREADY_EXISTS, final manifest not replaced', async () => {
    const results = await Promise.allSettled([
      repo.create('First', tmpBase),
      repo.create('Second', tmpBase),
    ]);

    const fulfilledIdx = results.findIndex((r) => r.status === 'fulfilled');
    const rejectedIdx = results.findIndex((r) => r.status === 'rejected');

    expect(fulfilledIdx).toBeGreaterThanOrEqual(0);
    expect(rejectedIdx).toBeGreaterThanOrEqual(0);

    const fulfilledResult = results[fulfilledIdx];
    const rejectedResult = results[rejectedIdx];

    if (fulfilledResult === undefined || fulfilledResult.status !== 'fulfilled') {
      throw new Error('Expected a fulfilled result');
    }
    if (rejectedResult === undefined || rejectedResult.status !== 'rejected') {
      throw new Error('Expected a rejected result');
    }

    expect(rejectedResult.reason).toBeInstanceOf(ProjectWorkspaceError);
    expect((rejectedResult.reason as ProjectWorkspaceError).code).toBe('PROJECT_ALREADY_EXISTS');

    const manifestPath = join(tmpBase, '.kwe', 'project.json');
    const content = await readFile(manifestPath, 'utf-8');
    const parsed = JSON.parse(content) as Record<string, unknown>;
    expect(parsed.name as string).toBe(fulfilledResult.value.name);
    expect(parsed.rootPath as string | undefined).toBeUndefined();

    const kweContents = await readdir(join(tmpBase, '.kwe'));
    const tmpFiles = kweContents.filter((f: string) => f.startsWith('.tmp.'));
    expect(tmpFiles).toHaveLength(0);
  });

  it('rejects manifest with whitespace name (PROJECT_MANIFEST_INVALID)', async () => {
    await mkdir(join(tmpBase, '.kwe'), { recursive: true });
    await writeFile(
      join(tmpBase, '.kwe', 'project.json'),
      JSON.stringify({
        schemaVersion: 1,
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        name: '  Project  ',
        createdAt: '2026-07-27T12:00:00.000Z',
        updatedAt: '2026-07-27T12:00:00.000Z',
      }),
      'utf-8',
    );

    const err = await repo.open(tmpBase).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);
    expect((err as ProjectWorkspaceError).code).toBe('PROJECT_MANIFEST_INVALID');
  });

  it('accepts both timestamp forms: with and without milliseconds', async () => {
    await mkdir(join(tmpBase, '.kwe'), { recursive: true });
    await writeFile(
      join(tmpBase, '.kwe', 'project.json'),
      JSON.stringify({
        schemaVersion: 1,
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
        createdAt: '2026-07-27T12:00:00Z',
        updatedAt: '2026-07-27T12:00:00.000Z',
      }),
      'utf-8',
    );

    const opened = await repo.open(tmpBase);
    expect(opened.projectId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  describe('AtomicFileSystem injection failures', () => {
    it('open failure throws PROJECT_IO_FAILED', async () => {
      const [fs, rec] = createMockFs();
      rec.failOn.push('open');
      const injectedRepo = createNodeProjectWorkspaceRepository(fs);
      const err = await injectedRepo.create('Test', tmpBase).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ProjectWorkspaceError);
      expect((err as ProjectWorkspaceError).code).toBe('PROJECT_IO_FAILED');
    });

    it('write failure throws PROJECT_IO_FAILED', async () => {
      const [fs, rec] = createMockFs();
      rec.failOn.push('write');
      const injectedRepo = createNodeProjectWorkspaceRepository(fs);
      const err = await injectedRepo.create('Test', tmpBase).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ProjectWorkspaceError);
      expect((err as ProjectWorkspaceError).code).toBe('PROJECT_IO_FAILED');
    });

    it('sync failure throws PROJECT_IO_FAILED', async () => {
      const [fs, rec] = createMockFs();
      rec.failOn.push('sync');
      const injectedRepo = createNodeProjectWorkspaceRepository(fs);
      const err = await injectedRepo.create('Test', tmpBase).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ProjectWorkspaceError);
      expect((err as ProjectWorkspaceError).code).toBe('PROJECT_IO_FAILED');
    });

    it('close failure throws PROJECT_IO_FAILED', async () => {
      const [fs, rec] = createMockFs();
      rec.failOn.push('close');
      const injectedRepo = createNodeProjectWorkspaceRepository(fs);
      const err = await injectedRepo.create('Test', tmpBase).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ProjectWorkspaceError);
      expect((err as ProjectWorkspaceError).code).toBe('PROJECT_IO_FAILED');
    });

    it('link EEXIST throws PROJECT_ALREADY_EXISTS', async () => {
      const [fs, rec] = createMockFs();
      rec.failOn.push('link');
      const injectedRepo = createNodeProjectWorkspaceRepository(fs);
      const err = await injectedRepo.create('Test', tmpBase).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ProjectWorkspaceError);
      expect((err as ProjectWorkspaceError).code).toBe('PROJECT_ALREADY_EXISTS');
    });

    it('other link failure throws PROJECT_IO_FAILED', async () => {
      const [fs, rec] = createMockFs();
      rec.failOn.push('link-other');
      const injectedRepo = createNodeProjectWorkspaceRepository(fs);
      const err = await injectedRepo.create('Test', tmpBase).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ProjectWorkspaceError);
      expect((err as ProjectWorkspaceError).code).toBe('PROJECT_IO_FAILED');
    });

    it('cleanup failure throws PROJECT_IO_FAILED', async () => {
      const [fs, rec] = createMockFs();
      rec.failOn.push('unlink');
      const injectedRepo = createNodeProjectWorkspaceRepository(fs);
      const err = await injectedRepo.create('Test', tmpBase).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ProjectWorkspaceError);
      expect((err as ProjectWorkspaceError).code).toBe('PROJECT_IO_FAILED');
    });

    it('successful publication leaves no .tmp.* files', async () => {
      const injectedRepo = createNodeProjectWorkspaceRepository(defaultAtomicFs);
      await injectedRepo.create('Test', tmpBase);
      const kweContents = await readdir(join(tmpBase, '.kwe'));
      const tmpFiles = kweContents.filter((f: string) => f.startsWith('.tmp.'));
      expect(tmpFiles).toHaveLength(0);
    });
  });

  it('handles partial write correctly', async () => {
    const partialFs: AtomicFileSystem = {
      ...defaultAtomicFs,
      writeAll(fd: number, buffer: Buffer): void {
        const mid = Math.floor(buffer.length / 2);
        writeSync(fd, buffer, 0, mid, null);
        writeSync(fd, buffer, mid, buffer.length - mid, null);
      },
    };
    const injectedRepo = createNodeProjectWorkspaceRepository(partialFs);
    const project = await injectedRepo.create('Partial Write Test', tmpBase);
    expect(project.name).toBe('Partial Write Test');
    const content = await readFile(join(tmpBase, '.kwe', 'project.json'), 'utf-8');
    expect(content).toContain('"name": "Partial Write Test"');
  });
});
