import { mkdir, mkdtemp, readdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';

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

  it('creates .kwe/project.json with valid content, ends with newline', async () => {
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

  it('does not include root path in the manifest', async () => {
    await repo.create('Test Project', tmpBase);

    const manifestPath = join(tmpBase, '.kwe', 'project.json');
    const content = await readFile(manifestPath, 'utf-8');

    expect(content).not.toContain('rootPath');
  });

  it('rejects creating over an existing project (PROJECT_ALREADY_EXISTS)', async () => {
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

  it('rejects opening without .kwe (PROJECT_MANIFEST_NOT_FOUND)', async () => {
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

  it('rejects non-existent root directory (PROJECT_PATH_INVALID)', async () => {
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

  it('rejects symlink root directory when platform supports it', async () => {
    const realDir = join(tmpBase, 'realdir');
    const linkDir = join(tmpBase, 'linkdir');
    await mkdir(realDir);

    let symlink: typeof import('node:fs/promises').symlink;
    try {
      symlink = (await import('node:fs/promises')).symlink;
      await symlink(realDir, linkDir, 'dir');
    } catch {
      // Platform does not support unprivileged symlinks — skip
      return;
    }

    // realpath resolves the symlink, but requireNoSymlink checks .kwe — pass a
    // path that resolves to a real directory to avoid PROJECT_PATH_INVALID first
    const err = await repo.create('Test', linkDir).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProjectWorkspaceError);
    expect((err as ProjectWorkspaceError).code).toBe('PROJECT_PATH_INVALID');
  });
});
