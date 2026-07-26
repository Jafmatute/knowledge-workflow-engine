import type { AppInfo, GetAppInfoInput } from '@kwe/schemas';

export const IPC_CHANNELS = {
  appGetInfo: 'app:get-info',
} as const;

export interface DesktopApi {
  readonly app: {
    getInfo(input: GetAppInfoInput): Promise<AppInfo>;
  };
}
