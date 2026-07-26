declare const projectIdBrand: unique symbol;

export type ProjectId = string & {
  readonly [projectIdBrand]: 'ProjectId';
};

export function createProjectId(value: string): ProjectId {
  return value as ProjectId;
}
