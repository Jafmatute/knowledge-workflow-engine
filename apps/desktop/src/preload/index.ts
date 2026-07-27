import { contextBridge, ipcRenderer } from 'electron';

import { IPC_CHANNELS, type DesktopApi } from '@kwe/contracts';
import {
  appInfoSchema,
  diagnosticHashInputSchema,
  getAppInfoInputSchema,
  diagnosticHashResultSchema,
  type DiagnosticHashInput,
  type GetAppInfoInput,
} from '@kwe/schemas';

const desktopApi: DesktopApi = Object.freeze({
  app: Object.freeze({
    async getInfo(input: GetAppInfoInput) {
      try {
        const response: unknown = await ipcRenderer.invoke(
          IPC_CHANNELS.appGetInfo,
          getAppInfoInputSchema.parse(input),
        );
        return appInfoSchema.parse(response);
      } catch {
        throw new Error('Unable to load application information.');
      }
    },
  }),
  system: Object.freeze({
    async computeDiagnosticHash(input: DiagnosticHashInput) {
      try {
        const response: unknown = await ipcRenderer.invoke(
          IPC_CHANNELS.systemComputeDiagnosticHash,
          diagnosticHashInputSchema.parse(input),
        );
        return diagnosticHashResultSchema.parse(response);
      } catch {
        throw new Error('Unable to verify the utility process.');
      }
    },
  }),
});

contextBridge.exposeInMainWorld('kwe', desktopApi);
