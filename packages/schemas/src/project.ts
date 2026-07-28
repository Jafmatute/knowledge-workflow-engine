import { z } from 'zod';

export const PROJECT_MANIFEST_SCHEMA_VERSION = 1 as const;
export const PROJECT_MANIFEST_MAX_BYTES = 64 * 1024;
export const PROJECT_NAME_MIN_LENGTH = 1;
export const PROJECT_NAME_MAX_LENGTH = 100;
export const WORKSPACE_DIR = '.kwe';
export const MANIFEST_FILE = 'project.json';

const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const iso8601Schema = z.string().regex(iso8601Regex, 'Must be a valid ISO-8601 UTC timestamp');

export const projectNameSchema = z
  .string()
  .min(PROJECT_NAME_MIN_LENGTH, 'Project name must not be empty')
  .max(
    PROJECT_NAME_MAX_LENGTH,
    `Project name must not exceed ${PROJECT_NAME_MAX_LENGTH} characters`,
  )
  .transform((v) => v.trim())
  .pipe(
    z
      .string()
      .min(PROJECT_NAME_MIN_LENGTH, 'Project name must not be empty after trimming')
      .max(
        PROJECT_NAME_MAX_LENGTH,
        `Project name must not exceed ${PROJECT_NAME_MAX_LENGTH} characters after trimming`,
      ),
  );

export const projectManifestSchema = z
  .object({
    schemaVersion: z.literal(PROJECT_MANIFEST_SCHEMA_VERSION),
    projectId: z.string().uuid('projectId must be a valid UUID'),
    name: projectNameSchema,
    createdAt: iso8601Schema,
    updatedAt: iso8601Schema,
  })
  .strict();
export type ProjectManifest = z.infer<typeof projectManifestSchema>;

export const createProjectInputSchema = z
  .object({
    name: projectNameSchema,
  })
  .strict();
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const activeProjectSchema = z
  .object({
    projectId: z.string().uuid(),
    name: z.string().min(1),
    rootPath: z.string().min(1),
    schemaVersion: z.literal(PROJECT_MANIFEST_SCHEMA_VERSION),
  })
  .strict();
export type ActiveProject = z.infer<typeof activeProjectSchema>;

export const projectCreatedResultSchema = z
  .object({
    status: z.literal('created'),
    project: activeProjectSchema,
  })
  .strict();

export const projectCancelledResultSchema = z
  .object({
    status: z.literal('cancelled'),
  })
  .strict();

export const projectOpenedResultSchema = z
  .object({
    status: z.literal('opened'),
    project: activeProjectSchema,
  })
  .strict();

export const createProjectResultSchema = z.discriminatedUnion('status', [
  projectCreatedResultSchema,
  projectCancelledResultSchema,
]);
export type CreateProjectResult = z.infer<typeof createProjectResultSchema>;

export const openProjectResultSchema = z.discriminatedUnion('status', [
  projectOpenedResultSchema,
  projectCancelledResultSchema,
]);
export type OpenProjectResult = z.infer<typeof openProjectResultSchema>;

export const getActiveProjectResultSchema = z.union([activeProjectSchema, z.null()]);
export type GetActiveProjectResult = z.infer<typeof getActiveProjectResultSchema>;

export const projectErrorCodeSchema = z.enum([
  'PROJECT_NAME_INVALID',
  'PROJECT_CREATION_CANCELLED',
  'PROJECT_OPEN_CANCELLED',
  'PROJECT_ALREADY_EXISTS',
  'PROJECT_MANIFEST_NOT_FOUND',
  'PROJECT_MANIFEST_INVALID',
  'PROJECT_VERSION_UNSUPPORTED',
  'PROJECT_PATH_INVALID',
  'PROJECT_IO_FAILED',
]);
export type ProjectErrorCode = z.infer<typeof projectErrorCodeSchema>;
