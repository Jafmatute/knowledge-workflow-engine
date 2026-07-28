import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createNodeProjectWorkspaceRepository } from './node-project-workspace.js';

describe('Node project workspace repository', () => {
  const tmpBase = join(process.cwd(), 'tmp-test-workspace');

  beforeEach(async () => {
    await mkdir(tmpBase, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpBase).catch(() => {});
  });

  const repo = createNodeProjectWorkspaceRepository();

  it('creates .kwe/project.json with valid content', async () => {
    const project = await repo.create('Test Project', tmpBase);

    expect(project.name).toBe('Test Project');
    expect(project.rootPath).toBe(tmpBase);
    expect(project.schemaVersion).toBe(1);

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

  it('rejects creating over an existing project', async () => {
    await repo.create('First', tmpBase);

    await expect(repo.create('Second', tmpBase)).rejects.toThrow('already exists');
  });

  it('opens a valid project', async () => {
    const created = await repo.create('Test Project', tmpBase);
    const opened = await repo.open(tmpBase);

    expect(opened.projectId).toBe(created.projectId);
    expect(opened.name).toBe('Test Project');
    expect(opened.rootPath).toBe(tmpBase);
  });

  it('rejects opening a directory without .kwe', async () => {
    await expect(repo.open(tmpBase)).rejects.toThrow('not found');
  });

  it('rejects opening a directory with malformed JSON manifest', async () => {
    await mkdir(join(tmpBase, '.kwe'), { recursive: true });
    await writeFile(join(tmpBase, '.kwe', 'project.json'), '{ invalid json }', 'utf-8');

    await expect(repo.open(tmpBase)).rejects.toThrow('not valid JSON');
  });

  it('rejects opening with unknown manifest fields', async () => {
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

    await expect(repo.open(tmpBase)).rejects.toThrow('Unrecognized key');
  });

  it('rejects unsupported schema version', async () => {
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

    await expect(repo.open(tmpBase)).rejects.toThrow();
  });

  it('rejects oversized manifest', async () => {
    await mkdir(join(tmpBase, '.kwe'), { recursive: true });
    await writeFile(join(tmpBase, '.kwe', 'project.json'), 'x'.repeat(65_537), 'utf-8');

    await expect(repo.open(tmpBase)).rejects.toThrow('exceeds maximum size');
  });

  it('rejects non-file manifest path', async () => {
    await mkdir(join(tmpBase, '.kwe', 'project.json'), { recursive: true });

    await expect(repo.open(tmpBase)).rejects.toThrow();
  });

  it('rejects non-existent root directory', async () => {
    const missing = join(tmpBase, 'does-not-exist');

    await expect(repo.create('Test', missing)).rejects.toThrow('does not exist');
  });

  it('does not delete unrelated files', async () => {
    const unrelatedPath = join(tmpBase, 'important.txt');
    await writeFile(unrelatedPath, 'keep me', 'utf-8');

    await repo.create('Test', tmpBase);

    expect(existsSync(unrelatedPath)).toBe(true);
  });
});

async function rm(dir: string): Promise<void> {
  const { rmSync } = await import('node:fs');
  rmSync(dir, { recursive: true, force: true });
}
