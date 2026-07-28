import { describe, expect, it } from 'vitest';

import {
  getNavigationMode,
  isAllowedApplicationNavigation,
  isTrustedIpcSender,
} from './navigation-policy.js';

describe('application navigation policy', () => {
  const development = getNavigationMode('http://localhost:5173/');
  const packaged = getNavigationMode(undefined);

  it('accepts only trusted development documents', () => {
    expect(isAllowedApplicationNavigation('http://localhost:5173/', development)).toBe(true);
    expect(isAllowedApplicationNavigation('http://localhost:5173/index.html', development)).toBe(
      true,
    );
    expect(isAllowedApplicationNavigation('http://localhost:5173@evil.example/', development)).toBe(
      false,
    );
    expect(isAllowedApplicationNavigation('http://localhost:5174/', development)).toBe(false);
    expect(isAllowedApplicationNavigation('https://localhost:5173/', development)).toBe(false);
  });

  it('accepts only the packaged application document', () => {
    expect(isAllowedApplicationNavigation('kwe://renderer/index.html', packaged)).toBe(true);
    expect(isAllowedApplicationNavigation('kwe://outside/index.html', packaged)).toBe(false);
    expect(isAllowedApplicationNavigation('not a URL', packaged)).toBe(false);
  });

  it('accepts only trusted main-frame IPC senders', () => {
    expect(
      isTrustedIpcSender({ isMainFrame: true, url: 'kwe://renderer/index.html' }, packaged),
    ).toBe(true);
    expect(
      isTrustedIpcSender({ isMainFrame: true, url: 'http://localhost:5173/' }, development),
    ).toBe(true);
    expect(
      isTrustedIpcSender(
        { isMainFrame: true, url: 'http://localhost:5173@evil.example/' },
        development,
      ),
    ).toBe(false);
    expect(
      isTrustedIpcSender({ isMainFrame: false, url: 'kwe://renderer/index.html' }, packaged),
    ).toBe(false);
    expect(isTrustedIpcSender(undefined, packaged)).toBe(false);
  });
});
