import {
  createProjectInputSchema,
  type CreateProjectResult,
  type OpenProjectResult,
} from '@kwe/schemas';

import type { DirectoryDialog, ProjectWorkspaceRepository } from './ports.js';

export function createCreateProjectUseCase(
  directoryDialog: DirectoryDialog,
  workspaceRepo: ProjectWorkspaceRepository,
) {
  return async (input: unknown): Promise<CreateProjectResult> => {
    const parsed = createProjectInputSchema.safeParse(input);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw Object.assign(new Error(firstIssue?.message ?? 'Invalid project name'), {
        code: 'PROJECT_NAME_INVALID' satisfies string,
      });
    }

    const rootPath = await directoryDialog.pickDirectory();

    if (rootPath === null) {
      return { status: 'cancelled' };
    }

    const project = await workspaceRepo.create(parsed.data.name, rootPath);
    return { status: 'created', project };
  };
}

export function createOpenProjectUseCase(
  directoryDialog: DirectoryDialog,
  workspaceRepo: ProjectWorkspaceRepository,
) {
  return async (): Promise<OpenProjectResult> => {
    const rootPath = await directoryDialog.pickDirectory();

    if (rootPath === null) {
      return { status: 'cancelled' };
    }

    const project = await workspaceRepo.open(rootPath);
    return { status: 'opened', project };
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
