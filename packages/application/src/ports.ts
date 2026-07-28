import type { ActiveProjectDto } from '@kwe/schemas';

export interface DirectoryDialog {
  pickCreateDirectory(): Promise<string | null>;
  pickOpenDirectory(): Promise<string | null>;
}

export const PROJECT_WORKSPACE_ERROR_CODES = [
  'PROJECT_ALREADY_EXISTS',
  'PROJECT_MANIFEST_NOT_FOUND',
  'PROJECT_MANIFEST_INVALID',
  'PROJECT_VERSION_UNSUPPORTED',
  'PROJECT_PATH_INVALID',
  'PROJECT_IO_FAILED',
] as const;

export type ProjectWorkspaceErrorCode = (typeof PROJECT_WORKSPACE_ERROR_CODES)[number];

export class ProjectWorkspaceError extends Error {
  readonly code: ProjectWorkspaceErrorCode;

  constructor(code: ProjectWorkspaceErrorCode, message: string) {
    super(message);
    this.name = 'ProjectWorkspaceError';
    this.code = code;
  }
}

export interface ProjectWorkspaceRepository {
  create(name: string, rootPath: string): Promise<ActiveProjectDto>;
  open(rootPath: string): Promise<ActiveProjectDto>;
}

export function assertWorkspaceError(error: unknown): ProjectWorkspaceError {
  if (error instanceof ProjectWorkspaceError) return error;
  return new ProjectWorkspaceError('PROJECT_IO_FAILED', 'Unknown filesystem error');
}

export function isProjectWorkspaceError(error: unknown): error is ProjectWorkspaceError {
  return error instanceof ProjectWorkspaceError;
}
