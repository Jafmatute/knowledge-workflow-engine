import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { relative, resolve, join } from 'node:path';

import type { ActiveProject } from '@kwe/domain';
import type { ProjectWorkspaceRepository } from '@kwe/application';
import {
  PROJECT_MANIFEST_MAX_BYTES,
  PROJECT_MANIFEST_SCHEMA_VERSION,
  WORKSPACE_DIR,
  MANIFEST_FILE,
  projectManifestSchema,
} from '@kwe/schemas';

type ProjectErrorCode =
  | 'PROJECT_ALREADY_EXISTS'
  | 'PROJECT_MANIFEST_NOT_FOUND'
  | 'PROJECT_MANIFEST_INVALID'
  | 'PROJECT_VERSION_UNSUPPORTED'
  | 'PROJECT_PATH_INVALID'
  | 'PROJECT_IO_FAILED';

class ProjectWorkspaceError extends Error {
  readonly code: ProjectErrorCode;
  readonly operation: string;

  constructor(code: ProjectErrorCode, message: string, operation: string) {
    super(message);
    this.name = 'ProjectWorkspaceError';
    this.code = code;
    this.operation = operation;
  }
}

function assertProjectError(error: unknown): ProjectWorkspaceError {
  if (error instanceof ProjectWorkspaceError) return error;

  const nodeError = error as { code?: string; message?: string };
  const msg = nodeError?.message ?? 'Unknown filesystem error';
  return new ProjectWorkspaceError('PROJECT_IO_FAILED', msg, 'filesystem');
}

function getKweDir(rootPath: string): string {
  return join(rootPath, WORKSPACE_DIR);
}

function getManifestPath(rootPath: string): string {
  return join(getKweDir(rootPath), MANIFEST_FILE);
}

async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw assertProjectError(error);
  }
}

function isSubPath(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return !rel.startsWith('..') && !relative(parent, child).startsWith('..');
}

function serializeManifest(data: Record<string, unknown>): string {
  return JSON.stringify(data, null, 2) + '\n';
}

async function atomicWrite(targetPath: string, content: string): Promise<void> {
  const tmpPath = `${targetPath}.tmp.${randomUUID()}`;

  try {
    await writeFile(tmpPath, content, { encoding: 'utf-8' });

    if (process.platform !== 'win32') {
      const fileHandle = await open(tmpPath, 'r');
      try {
        await fileHandle.sync();
      } finally {
        await fileHandle.close();
      }
    }

    await rename(tmpPath, targetPath);
  } catch (error) {
    await unlink(tmpPath).catch(() => {});
    throw assertProjectError(error);
  }
}

export function createNodeProjectWorkspaceRepository(): ProjectWorkspaceRepository {
  return {
    async create(name: string, rootPath: string): Promise<ActiveProject> {
      const resolvedRoot = resolve(rootPath);
      const kweDir = getKweDir(resolvedRoot);
      const manifestPath = getManifestPath(resolvedRoot);

      let rootStat;
      try {
        rootStat = await stat(resolvedRoot);
      } catch {
        throw new ProjectWorkspaceError(
          'PROJECT_PATH_INVALID',
          'Selected directory does not exist',
          'create',
        );
      }

      if (!rootStat.isDirectory()) {
        throw new ProjectWorkspaceError(
          'PROJECT_PATH_INVALID',
          'Selected path is not a directory',
          'create',
        );
      }

      if (!isSubPath(resolvedRoot, kweDir)) {
        throw new ProjectWorkspaceError(
          'PROJECT_PATH_INVALID',
          'Manifest directory must be inside the project root',
          'create',
        );
      }

      try {
        const existingStat = await stat(manifestPath);
        if (existingStat.isFile() || existingStat.isDirectory()) {
          throw new ProjectWorkspaceError(
            'PROJECT_ALREADY_EXISTS',
            'A project already exists at this location',
            'create',
          );
        }
      } catch (error) {
        const nodeErr = error as { code?: string };
        if (nodeErr?.code !== 'ENOENT') {
          if (error instanceof ProjectWorkspaceError) throw error;
        }
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
      await ensureDirectory(kweDir);
      await atomicWrite(manifestPath, serializeManifest(validatedManifest));

      return {
        projectId: validatedManifest.projectId,
        name: validatedManifest.name,
        rootPath: resolvedRoot,
        schemaVersion: PROJECT_MANIFEST_SCHEMA_VERSION,
      };
    },

    async open(rootPath: string): Promise<ActiveProject> {
      const resolvedRoot = resolve(rootPath);
      const kweDir = getKweDir(resolvedRoot);
      const manifestPath = getManifestPath(resolvedRoot);

      let rootStat;
      try {
        rootStat = await stat(resolvedRoot);
      } catch {
        throw new ProjectWorkspaceError(
          'PROJECT_PATH_INVALID',
          'Selected directory does not exist',
          'open',
        );
      }

      if (!rootStat.isDirectory()) {
        throw new ProjectWorkspaceError(
          'PROJECT_PATH_INVALID',
          'Selected path is not a directory',
          'open',
        );
      }

      let kweStat;
      try {
        kweStat = await stat(kweDir);
      } catch {
        throw new ProjectWorkspaceError(
          'PROJECT_MANIFEST_NOT_FOUND',
          'Workspace directory .kwe not found',
          'open',
        );
      }

      if (!kweStat.isDirectory()) {
        throw new ProjectWorkspaceError(
          'PROJECT_MANIFEST_NOT_FOUND',
          'Workspace directory .kwe is not a directory',
          'open',
        );
      }

      let manifestStat;
      try {
        manifestStat = await stat(manifestPath);
      } catch {
        throw new ProjectWorkspaceError(
          'PROJECT_MANIFEST_NOT_FOUND',
          'Project manifest not found',
          'open',
        );
      }

      if (!manifestStat.isFile()) {
        throw new ProjectWorkspaceError(
          'PROJECT_MANIFEST_INVALID',
          'Manifest path is not a regular file',
          'open',
        );
      }

      if (manifestStat.size > PROJECT_MANIFEST_MAX_BYTES) {
        throw new ProjectWorkspaceError(
          'PROJECT_MANIFEST_INVALID',
          'Manifest file exceeds maximum size',
          'open',
        );
      }

      let content: string;
      try {
        content = await readFile(manifestPath, { encoding: 'utf-8' });
      } catch (error) {
        throw assertProjectError(error);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new ProjectWorkspaceError(
          'PROJECT_MANIFEST_INVALID',
          'Manifest is not valid JSON',
          'open',
        );
      }

      const parseResult = projectManifestSchema.safeParse(parsed);

      if (!parseResult.success) {
        const firstIssue = parseResult.error.issues[0];
        throw new ProjectWorkspaceError(
          'PROJECT_MANIFEST_INVALID',
          firstIssue?.message ?? 'Manifest validation failed',
          'open',
        );
      }

      if (!isSubPath(resolvedRoot, manifestPath)) {
        throw new ProjectWorkspaceError(
          'PROJECT_PATH_INVALID',
          'Manifest path must resolve inside the project root',
          'open',
        );
      }

      return {
        projectId: parseResult.data.projectId,
        name: parseResult.data.name,
        rootPath: resolvedRoot,
        schemaVersion: PROJECT_MANIFEST_SCHEMA_VERSION,
      };
    },
  };
}
