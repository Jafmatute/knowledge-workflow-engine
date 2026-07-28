import type { ActiveProject } from '@kwe/domain';

export interface DirectoryDialog {
  pickDirectory(parentWindow?: unknown): Promise<string | null>;
}

export interface ProjectWorkspaceRepository {
  create(name: string, rootPath: string): Promise<ActiveProject>;
  open(rootPath: string): Promise<ActiveProject>;
}
