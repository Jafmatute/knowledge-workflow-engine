import { chmod, mkdir, mkdtemp, readdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';

import { platform } from 'node:os';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createNodeProjectWorkspaceRepository } from './node-project-workspace.js';
import { ProjectWorkspaceError } from '@kwe/application';

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

  it('accepts root symlink (canonicalizes it)', async () => {
    const realDir = join(tmpBase, 'realdir');
    const linkDir = join(tmpBase, 'linkdir');
    await mkdir(realDir);

    let symlinkFn: typeof import('node:fs/promises').symlink;
    try {
      symlinkFn = (await import('node:fs/promises')).symlink;
      await symlinkFn(realDir, linkDir, 'dir');
    } catch {
      return;
    }

    const project = await repo.create('Test', linkDir);
    const canonical = await realpath(realDir);
    expect(project.rootPath).toBe(canonical);
  });

  it('rejects .kwe symlink (PROJECT_PATH_INVALID)', async () => {
    const realKwe = join(tmpBase, 'real-kwe');
    const kweDir = join(tmpBase, '.kwe');
    await mkdir(realKwe);

    let symlinkFn: typeof import('node:fs/promises').symlink;
    try {
      symlinkFn = (await import('node:fs/promises')).symlink;
      await symlinkFn(realKwe, kweDir, 'dir');
    } catch {
      return;
    }

    const err = await repo.create('Test', tmpBase).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);
    expect((err as ProjectWorkspaceError).code).toBe('PROJECT_PATH_INVALID');
  });

  it('rejects project.json symlink (PROJECT_PATH_INVALID)', async () => {
    const kweDir = join(tmpBase, '.kwe');
    const manifestPath = join(kweDir, 'project.json');
    await mkdir(kweDir);
    await writeFile(join(tmpBase, 'real-manifest.json'), '{}', 'utf-8');

    let symlinkFn: typeof import('node:fs/promises').symlink;
    try {
      symlinkFn = (await import('node:fs/promises')).symlink;
      await symlinkFn(join(tmpBase, 'real-manifest.json'), manifestPath, 'file');
    } catch {
      return;
    }

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
  });

  it('cleans up temp file after write failure', async () => {
    if (platform() === 'win32') {
      // chmod is not reliable for write simulation on Windows
      return;
    }

    await mkdir(join(tmpBase, '.kwe'), { recursive: true });

    try {
      await chmod(join(tmpBase, '.kwe'), 0o444);
    } catch {
      return;
    }

    const err = await repo.create('Test', tmpBase).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);

    const kweContents = await readdir(join(tmpBase, '.kwe'));
    const tmpFiles = kweContents.filter((f: string) => f.startsWith('.tmp.'));
    expect(tmpFiles).toHaveLength(0);

    await chmod(join(tmpBase, '.kwe'), 0o755).catch(() => {});
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
});
