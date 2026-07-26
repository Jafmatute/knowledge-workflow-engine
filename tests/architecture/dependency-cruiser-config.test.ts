import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const configurationPath = fileURLToPath(new URL('../../dependency-cruiser.cjs', import.meta.url));
const dependencyCruiserPath = fileURLToPath(
  new URL('../../node_modules/dependency-cruiser/bin/dependency-cruise.mjs', import.meta.url),
);

function cruise(target: string) {
  return spawnSync(
    process.execPath,
    [dependencyCruiserPath, '--config', configurationPath, target],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
    },
  );
}

describe('dependency-cruiser configuration', () => {
  it('accepts the production package source tree', () => {
    expect(cruise('packages').status).toBe(0);
  });

  it('reports a forbidden workspace package dependency', () => {
    const fixture = 'tests/fixtures/architecture/packages/application/src/invalid-dependency.ts';
    const result = cruise(fixture);

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'application-cannot-import-infrastructure-or-desktop',
    );
  });
});
