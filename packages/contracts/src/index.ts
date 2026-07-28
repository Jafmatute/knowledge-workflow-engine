import type {
  AppInfo,
  DiagnosticHashInput,
  DiagnosticHashResult,
  GetAppInfoInput,
} from '@kwe/schemas';

export const IPC_CHANNELS = {
  appGetInfo: 'app:get-info',
  systemComputeDiagnosticHash: 'system:compute-diagnostic-hash',
} as const;

export interface DesktopApi {
  readonly app: {
    getInfo(input: GetAppInfoInput): Promise<AppInfo>;
  };
  readonly system: {
    computeDiagnosticHash(input: DiagnosticHashInput): Promise<DiagnosticHashResult>;
  };
}
