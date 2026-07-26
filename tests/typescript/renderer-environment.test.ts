import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const tscPath = fileURLToPath(new URL('../../node_modules/typescript/bin/tsc', import.meta.url));
const rendererFixtureConfig = fileURLToPath(
  new URL('../../apps/desktop/tsconfig.renderer-fixture.json', import.meta.url),
);

describe('renderer TypeScript environment', () => {
  it('rejects Node globals in the isolated renderer fixture', () => {
    const result = spawnSync(process.execPath, [tscPath, '--project', rendererFixtureConfig], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/Cannot find name '(process|require)'/);
  });
});
