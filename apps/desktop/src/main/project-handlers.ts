import { createProjectUseCases, type ProjectUseCases } from '@kwe/application';
import type { ActiveProject } from '@kwe/domain';
import {
  createProjectInputSchema,
  type CreateProjectResult,
  type GetActiveProjectResult,
  type OpenProjectResult,
} from '@kwe/schemas';

import type { DirectoryDialog } from '@kwe/application';

export { createElectronDirectoryDialog } from './project-dialog.js';

let activeProject: ActiveProject | null = null;

export function getActiveProject(): ActiveProject | null {
  return activeProject;
}

function setActiveProject(project: ActiveProject): void {
  activeProject = project;
}

export function clearActiveProject(): void {
  activeProject = null;
}

export function createProjectHandlers(
  directoryDialog: DirectoryDialog,
  workspaceRepo: Parameters<typeof createProjectUseCases>[1],
): ProjectUseCases {
  const useCases = createProjectUseCases(directoryDialog, workspaceRepo);

  return {
    async create(input: unknown): Promise<CreateProjectResult> {
      const result = await useCases.create(input);
      if (result.status === 'created') {
        setActiveProject(result.project);
      }
      return result;
    },

    async open(): Promise<OpenProjectResult> {
      const result = await useCases.open();
      if (result.status === 'opened') {
        setActiveProject(result.project);
      }
      return result;
    },
  };
}

export { createProjectInputSchema };
export type { ProjectUseCases, CreateProjectResult, GetActiveProjectResult, OpenProjectResult };
