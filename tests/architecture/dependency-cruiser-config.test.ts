import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const configuration = require('../../dependency-cruiser.cjs') as {
  forbidden: Array<{ name: string }>;
};

describe('dependency-cruiser configuration', () => {
  it('forbids application imports from infrastructure', () => {
    expect(configuration.forbidden.map((rule) => rule.name)).toContain(
      'application-cannot-import-infrastructure',
    );
  });
});
