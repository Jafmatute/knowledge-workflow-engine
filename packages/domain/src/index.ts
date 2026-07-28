declare const projectIdBrand: unique symbol;

export type ProjectId = string & {
  readonly [projectIdBrand]: 'ProjectId';
};

export function createProjectId(value: string): ProjectId {
  return value as ProjectId;
}

export interface ProjectManifest {
  readonly schemaVersion: 1;
  readonly projectId: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ActiveProject {
  readonly projectId: string;
  readonly name: string;
  readonly rootPath: string;
  readonly schemaVersion: 1;
}
