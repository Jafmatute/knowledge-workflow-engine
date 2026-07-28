import {
  createProjectInputSchema,
  type CreateProjectResult,
  type OpenProjectResult,
} from '@kwe/schemas';

import type { DirectoryDialog, ProjectWorkspaceRepository } from './ports.js';
import { isProjectWorkspaceError } from './ports.js';

function mapError(error: unknown): CreateProjectResult | OpenProjectResult {
  if (isProjectWorkspaceError(error)) {
    return { status: 'failed', error: { code: error.code } };
  }
  return { status: 'failed', error: { code: 'PROJECT_IO_FAILED' } };
}

export function createCreateProjectUseCase(
  directoryDialog: DirectoryDialog,
  workspaceRepo: ProjectWorkspaceRepository,
) {
  return async (input: unknown): Promise<CreateProjectResult> => {
    const parsed = createProjectInputSchema.safeParse(input);

    if (!parsed.success) {
      return { status: 'failed', error: { code: 'PROJECT_NAME_INVALID' } };
    }

    const rootPath = await directoryDialog.pickCreateDirectory();

    if (rootPath === null) {
      return { status: 'cancelled' };
    }

    try {
      const project = await workspaceRepo.create(parsed.data.name, rootPath);
      return { status: 'created', project };
    } catch (error: unknown) {
      return mapError(error) as CreateProjectResult;
    }
  };
}

export function createOpenProjectUseCase(
  directoryDialog: DirectoryDialog,
  workspaceRepo: ProjectWorkspaceRepository,
) {
  return async (): Promise<OpenProjectResult> => {
    const rootPath = await directoryDialog.pickOpenDirectory();

    if (rootPath === null) {
      return { status: 'cancelled' };
    }

    try {
      const project = await workspaceRepo.open(rootPath);
      return { status: 'opened', project };
    } catch (error: unknown) {
      return mapError(error) as OpenProjectResult;
    }
  };
}

export interface ProjectUseCases {
  create(input: unknown): Promise<CreateProjectResult>;
  open(): Promise<OpenProjectResult>;
}

export function createProjectUseCases(
  directoryDialog: DirectoryDialog,
  workspaceRepo: ProjectWorkspaceRepository,
): ProjectUseCases {
  const create = createCreateProjectUseCase(directoryDialog, workspaceRepo);
  const open = createOpenProjectUseCase(directoryDialog, workspaceRepo);
  return { create, open };
}
