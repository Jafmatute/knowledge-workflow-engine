import { createProjectUseCases, type ProjectUseCases } from '@kwe/application';
import {
  activeProjectDtoSchema,
  createProjectInputSchema,
  createProjectResultSchema,
  openProjectResultSchema,
} from '@kwe/schemas';
import type {
  ActiveProjectDto,
  CreateProjectResult,
  GetActiveProjectResult,
  OpenProjectResult,
} from '@kwe/schemas';

import type { DirectoryDialog } from '@kwe/application';

export { createElectronDirectoryDialog } from './project-dialog.js';

let activeProject: ActiveProjectDto | null = null;

export function getActiveProject(): ActiveProjectDto | null {
  return activeProject;
}

function setActiveProject(project: ActiveProjectDto): void {
  activeProject = project;
}

function validateActiveProject(raw: unknown): ActiveProjectDto | null {
  const parsed = activeProjectDtoSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function createProjectHandlers(
  directoryDialog: DirectoryDialog,
  workspaceRepo: Parameters<typeof createProjectUseCases>[1],
): ProjectUseCases {
  const useCases = createProjectUseCases(directoryDialog, workspaceRepo);

  return {
    async create(input: unknown): Promise<CreateProjectResult> {
      const result = await useCases.create(input);
      const validated = createProjectResultSchema.parse(result);
      if (validated.status === 'created') {
        const project = validateActiveProject(validated.project);
        if (project !== null) {
          setActiveProject(project);
        }
      }
      return validated;
    },

    async open(): Promise<OpenProjectResult> {
      const result = await useCases.open();
      const validated = openProjectResultSchema.parse(result);
      if (validated.status === 'opened') {
        const project = validateActiveProject(validated.project);
        if (project !== null) {
          setActiveProject(project);
        }
      }
      return validated;
    },
  };
}

export { createProjectInputSchema };
export type { ProjectUseCases, CreateProjectResult, GetActiveProjectResult, OpenProjectResult };
