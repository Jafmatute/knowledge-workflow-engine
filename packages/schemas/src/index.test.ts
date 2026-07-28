import { describe, expect, it } from 'vitest';

import { appInfoSchema, getAppInfoInputSchema } from './index.js';

describe('app information schemas', () => {
  it('accepts an empty get-app-info input', () => {
    expect(getAppInfoInputSchema.parse({})).toEqual({});
  });

  it('rejects unexpected get-app-info input fields', () => {
    expect(getAppInfoInputSchema.safeParse({ version: '1.0.0' }).success).toBe(false);
  });

  it('accepts a non-empty application version', () => {
    expect(appInfoSchema.parse({ version: '0.1.0' })).toEqual({ version: '0.1.0' });
  });

  it('rejects invalid application information', () => {
    expect(appInfoSchema.safeParse({ version: '' }).success).toBe(false);
    expect(appInfoSchema.safeParse({ version: '0.1.0', extra: true }).success).toBe(false);
  });
});
