export type NavigationMode =
  { readonly kind: 'development'; readonly viteUrl: string } | { readonly kind: 'packaged' };

const PACKAGED_DOCUMENT = 'kwe://renderer/index.html';

export function getNavigationMode(viteUrl: string | undefined): NavigationMode {
  return viteUrl === undefined ? { kind: 'packaged' } : { kind: 'development', viteUrl };
}

export function getApplicationDocumentUrl(mode: NavigationMode): string {
  return mode.kind === 'development' ? mode.viteUrl : PACKAGED_DOCUMENT;
}

export function isAllowedApplicationNavigation(
  navigationUrl: string,
  mode: NavigationMode,
): boolean {
  try {
    const candidate = new URL(navigationUrl);

    if (candidate.username !== '' || candidate.password !== '') {
      return false;
    }

    if (mode.kind === 'development') {
      const trusted = new URL(mode.viteUrl);

      return (
        candidate.origin === trusted.origin &&
        (candidate.pathname === trusted.pathname || candidate.pathname === '/index.html')
      );
    }

    return (
      candidate.protocol === 'kwe:' &&
      candidate.hostname === 'renderer' &&
      candidate.pathname === '/index.html' &&
      candidate.search === '' &&
      candidate.hash === ''
    );
  } catch {
    return false;
  }
}

export interface IpcSenderFrame {
  readonly isMainFrame: boolean;
  readonly url: string | undefined;
}

export function isTrustedIpcSender(
  senderFrame: IpcSenderFrame | null | undefined,
  mode: NavigationMode,
): boolean {
  return (
    senderFrame !== null &&
    senderFrame !== undefined &&
    senderFrame.isMainFrame &&
    senderFrame.url !== undefined &&
    isAllowedApplicationNavigation(senderFrame.url, mode)
  );
}
