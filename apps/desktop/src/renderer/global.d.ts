import type { DesktopApi } from '@kwe/contracts';

declare global {
  interface Window {
    kwe: DesktopApi;
  }
}

export {};
