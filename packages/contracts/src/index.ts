import type {
  CreateProjectInput,
  CreateProjectResult,
  GetActiveProjectResult,
  OpenProjectResult,
} from '@kwe/schemas';

export const IPC_CHANNELS = {
  appGetInfo: 'app:get-info',
  systemComputeDiagnosticHash: 'system:compute-diagnostic-hash',
  projectCreate: 'project:create',
  projectOpen: 'project:open',
  projectGetActive: 'project:get-active',
} as const;

export interface DesktopApi {
  readonly app: {
    getInfo(input: Record<string, never>): Promise<{ version: string }>;
  };
  readonly system: {
    computeDiagnosticHash(input: { text: string }): Promise<{ algorithm: string; digest: string }>;
  };
  readonly projects: {
    create(input: CreateProjectInput): Promise<CreateProjectResult>;
    open(): Promise<OpenProjectResult>;
    getActive(): Promise<GetActiveProjectResult>;
  };
}
