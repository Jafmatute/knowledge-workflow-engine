import { randomUUID } from 'node:crypto';
import { linkSync, openSync, unlinkSync, writeSync, fsyncSync, closeSync } from 'node:fs';
import { lstat, mkdir, readFile, realpath, stat } from 'node:fs/promises';
import { join } from 'node:path';

import type { ProjectWorkspaceRepository } from '@kwe/application';
import { ProjectWorkspaceError } from '@kwe/application';
import type { ActiveProjectDto } from '@kwe/schemas';
import {
  PROJECT_MANIFEST_MAX_BYTES,
  PROJECT_MANIFEST_SCHEMA_VERSION,
  WORKSPACE_DIR,
  MANIFEST_FILE,
  projectManifestSchema,
} from '@kwe/schemas';

export interface AtomicFileSystem {
  openWriteExclusive(path: string): number;
  writeAll(fd: number, buffer: Buffer): void;
  sync(fd: number): void;
  close(fd: number): void;
  link(src: string, dest: string): void;
  unlink(path: string): void;
}

export const defaultAtomicFs: AtomicFileSystem = {
  openWriteExclusive(path: string): number {
    return openSync(path, 'wx');
  },
  writeAll(fd: number, buffer: Buffer): void {
    let offset = 0;
    while (offset < buffer.length) {
      const written = writeSync(fd, buffer, offset, buffer.length - offset, null);
      if (written <= 0) throw new Error('Zero-byte write');
      offset += written;
    }
  },
  sync(fd: number): void {
    fsyncSync(fd);
  },
  close(fd: number): void {
    closeSync(fd);
  },
  link(src: string, dest: string): void {
    linkSync(src, dest);
  },
  unlink(path: string): void {
    unlinkSync(path);
  },
};

function getKweDir(rootPath: string): string {
  return join(rootPath, WORKSPACE_DIR);
}

function getManifestPath(rootPath: string): string {
  return join(getKweDir(rootPath), MANIFEST_FILE);
}

function isEnoent(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === 'ENOENT';
}

async function canonicalDir(rootPath: string): Promise<string> {
  try {
    return await realpath(rootPath);
  } catch (error: unknown) {
    if (isEnoent(error)) {
      throw new ProjectWorkspaceError('PROJECT_PATH_INVALID', 'Selected root does not exist');
    }
    throw new ProjectWorkspaceError('PROJECT_IO_FAILED', 'Failed to resolve project root');
  }
}

async function requireDirectory(dirPath: string): Promise<void> {
  let st;
  try {
    st = await stat(dirPath);
  } catch (error: unknown) {
    if (isEnoent(error)) {
      throw new ProjectWorkspaceError('PROJECT_PATH_INVALID', 'Selected path does not exist');
    }
    throw new ProjectWorkspaceError('PROJECT_IO_FAILED', 'Failed to inspect directory');
  }
  if (!st.isDirectory()) {
    throw new ProjectWorkspaceError('PROJECT_PATH_INVALID', 'Selected path is not a directory');
  }
}

async function requireNoSymlink(targetPath: string, label: string): Promise<void> {
  let st;
  try {
    st = await lstat(targetPath);
  } catch (error: unknown) {
    if (isEnoent(error)) return;
    throw new ProjectWorkspaceError('PROJECT_IO_FAILED', `Failed to inspect ${label}`);
  }
  if (st.isSymbolicLink()) {
    throw new ProjectWorkspaceError('PROJECT_PATH_INVALID', `${label} must not be a symbolic link`);
  }
}

function isContained(parent: string, child: string): boolean {
  const parentNorm = parent.replace(/\\/g, '/').replace(/\/$/, '');
  const childNorm = child.replace(/\\/g, '/');
  if (!childNorm.startsWith(parentNorm + '/') && childNorm !== parentNorm) {
    return false;
  }
  return true;
}

export function createNodeProjectWorkspaceRepository(
  atomicFs?: AtomicFileSystem,
): ProjectWorkspaceRepository {
  const fs: AtomicFileSystem = atomicFs ?? defaultAtomicFs;

  return {
    async create(name: string, rootPath: string): Promise<ActiveProjectDto> {
      const canonicalRoot = await canonicalDir(rootPath);
      await requireDirectory(canonicalRoot);

      const kweDir = getKweDir(canonicalRoot);
      const manifestPath = getManifestPath(canonicalRoot);

      await requireNoSymlink(kweDir, '.kwe');
      await requireNoSymlink(manifestPath, 'project.json');

      const canonicalKwe = join(canonicalRoot, WORKSPACE_DIR);
      const canonicalManifest = join(canonicalRoot, WORKSPACE_DIR, MANIFEST_FILE);

      if (
        !isContained(canonicalRoot, canonicalKwe) ||
        !isContained(canonicalRoot, canonicalManifest)
      ) {
        throw new ProjectWorkspaceError(
          'PROJECT_PATH_INVALID',
          'Workspace paths must resolve inside the project root',
        );
      }

      const now = new Date().toISOString();
      const manifestData = {
        schemaVersion: PROJECT_MANIFEST_SCHEMA_VERSION,
        projectId: randomUUID(),
        name,
        createdAt: now,
        updatedAt: now,
      };

      const validatedManifest = projectManifestSchema.parse(manifestData);

      try {
        await mkdir(kweDir, { recursive: true });
      } catch {
        throw new ProjectWorkspaceError(
          'PROJECT_IO_FAILED',
          'Failed to create workspace directory',
        );
      }

      const tmpPath = join(kweDir, `.tmp.${randomUUID()}`);
      const contentBytes = JSON.stringify(validatedManifest, null, 2) + '\n';
      const buf = Buffer.from(contentBytes, 'utf-8');

      let fd: number;

      try {
        fd = fs.openWriteExclusive(tmpPath);
      } catch (error: unknown) {
        const nodeErr = error as NodeJS.ErrnoException;
        if (nodeErr?.code === 'EEXIST') {
          throw new ProjectWorkspaceError('PROJECT_IO_FAILED', 'Temporary file already exists');
        }
        throw new ProjectWorkspaceError('PROJECT_IO_FAILED', 'Failed to create temporary file');
      }

      try {
        fs.writeAll(fd, buf);
        fs.sync(fd);
        fs.close(fd);
      } catch {
        try { fs.close(fd); } catch { /* close failure after write/sync failure */ }
        try { fs.unlink(tmpPath); } catch (_e) { if (!isEnoent(_e)) { /* suppress */ } }
        throw new ProjectWorkspaceError('PROJECT_IO_FAILED', 'Failed to write temporary file');
      }

      try {
        fs.link(tmpPath, manifestPath);
      } catch (error: unknown) {
        try { fs.unlink(tmpPath); } catch (_e) { if (!isEnoent(_e)) { /* suppress */ } }
        const nodeErr = error as NodeJS.ErrnoException;
        if (nodeErr?.code === 'EEXIST') {
          throw new ProjectWorkspaceError('PROJECT_ALREADY_EXISTS', 'A project already exists at this location');
        }
        throw new ProjectWorkspaceError('PROJECT_IO_FAILED', 'Failed to publish project manifest');
      }

      try {
        fs.unlink(tmpPath);
      } catch {
        throw new ProjectWorkspaceError('PROJECT_IO_FAILED', 'Failed to clean up temporary file');
      }

      let content: string;
      try {
        content = await readFile(manifestPath, { encoding: 'utf-8' });
      } catch {
        throw new ProjectWorkspaceError('PROJECT_IO_FAILED', 'Failed to read published manifest');
      }

      if (Buffer.byteLength(content, 'utf-8') > PROJECT_MANIFEST_MAX_BYTES) {
        throw new ProjectWorkspaceError(
          'PROJECT_IO_FAILED',
          'Published manifest exceeds size limit',
        );
      }

      let verified: ReturnType<typeof projectManifestSchema.parse>;
      try {
        verified = projectManifestSchema.parse(JSON.parse(content));
      } catch {
        throw new ProjectWorkspaceError(
          'PROJECT_IO_FAILED',
          'Published manifest failed validation',
        );
      }

      return {
        projectId: verified.projectId,
        name: verified.name,
        rootPath: canonicalRoot,
        schemaVersion: PROJECT_MANIFEST_SCHEMA_VERSION,
      };
    },

    async open(rootPath: string): Promise<ActiveProjectDto> {
      const canonicalRoot = await canonicalDir(rootPath);
      await requireDirectory(canonicalRoot);

      const kweDir = getKweDir(canonicalRoot);
      const manifestPath = getManifestPath(canonicalRoot);

      await requireNoSymlink(kweDir, '.kwe');
      await requireNoSymlink(manifestPath, 'project.json');

      const canonicalKwe = join(canonicalRoot, WORKSPACE_DIR);
      const canonicalManifest = join(canonicalRoot, WORKSPACE_DIR, MANIFEST_FILE);

      if (
        !isContained(canonicalRoot, canonicalKwe) ||
        !isContained(canonicalRoot, canonicalManifest)
      ) {
        throw new ProjectWorkspaceError(
          'PROJECT_PATH_INVALID',
          'Workspace paths must resolve inside the project root',
        );
      }

      let kweStat;
      try {
        kweStat = await stat(kweDir);
      } catch (error: unknown) {
        if (isEnoent(error)) {
          throw new ProjectWorkspaceError(
            'PROJECT_MANIFEST_NOT_FOUND',
            'Workspace directory not found',
          );
        }
        throw new ProjectWorkspaceError(
          'PROJECT_IO_FAILED',
          'Failed to inspect workspace directory',
        );
      }
      if (!kweStat.isDirectory()) {
        throw new ProjectWorkspaceError(
          'PROJECT_MANIFEST_NOT_FOUND',
          'Workspace path is not a directory',
        );
      }

      let manifestStat;
      try {
        manifestStat = await stat(manifestPath);
      } catch (error: unknown) {
        if (isEnoent(error)) {
          throw new ProjectWorkspaceError(
            'PROJECT_MANIFEST_NOT_FOUND',
            'Project manifest not found',
          );
        }
        throw new ProjectWorkspaceError('PROJECT_IO_FAILED', 'Failed to inspect manifest');
      }
      if (!manifestStat.isFile()) {
        throw new ProjectWorkspaceError(
          'PROJECT_MANIFEST_INVALID',
          'Manifest is not a regular file',
        );
      }
      if (manifestStat.size > PROJECT_MANIFEST_MAX_BYTES) {
        throw new ProjectWorkspaceError(
          'PROJECT_MANIFEST_INVALID',
          'Manifest exceeds maximum size',
        );
      }

      let content: string;
      try {
        content = await readFile(manifestPath, { encoding: 'utf-8' });
      } catch (error: unknown) {
        if (isEnoent(error)) {
          throw new ProjectWorkspaceError(
            'PROJECT_MANIFEST_NOT_FOUND',
            'Project manifest not found',
          );
        }
        throw new ProjectWorkspaceError('PROJECT_IO_FAILED', 'Failed to read manifest');
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new ProjectWorkspaceError('PROJECT_MANIFEST_INVALID', 'Manifest is not valid JSON');
      }

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new ProjectWorkspaceError(
          'PROJECT_MANIFEST_INVALID',
          'Manifest must be a plain object',
        );
      }

      const raw = parsed as Record<string, unknown>;

      if (
        raw.schemaVersion !== undefined &&
        raw.schemaVersion !== PROJECT_MANIFEST_SCHEMA_VERSION
      ) {
        const versionStr =
          typeof raw.schemaVersion === 'string' || typeof raw.schemaVersion === 'number'
            ? String(raw.schemaVersion)
            : 'unknown';
        throw new ProjectWorkspaceError(
          'PROJECT_VERSION_UNSUPPORTED',
          `Manifest schema version ${versionStr} is not supported`,
        );
      }

      const parseResult = projectManifestSchema.safeParse(parsed);
      if (!parseResult.success) {
        throw new ProjectWorkspaceError('PROJECT_MANIFEST_INVALID', 'Manifest validation failed');
      }

      return {
        projectId: parseResult.data.projectId,
        name: parseResult.data.name,
        rootPath: canonicalRoot,
        schemaVersion: PROJECT_MANIFEST_SCHEMA_VERSION,
      };
    },
  };
}
