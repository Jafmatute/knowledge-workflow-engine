import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { listPackage } from '@electron/asar';

import {
  APP_EXE,
  findPackagedApplicationExecutable,
  findWindowsX64PackageDirectory,
} from './package-layout.mjs';

const OUTPUT_DIR = join(process.cwd(), 'apps', 'desktop', 'out');

async function main() {
  const pkgDir = findWindowsX64PackageDirectory(OUTPUT_DIR);
  const exePath = findPackagedApplicationExecutable(pkgDir);

  console.log(`  ✓ ${APP_EXE}  (${exePath})`);

  // Resources directory
  const resourcesDir = join(pkgDir, 'resources');
  if (!existsSync(resourcesDir)) throw new Error('Missing resources directory');
  console.log('  ✓ resources/');

  // app.asar
  const asarPath = join(resourcesDir, 'app.asar');
  if (!existsSync(asarPath)) throw new Error('Missing app.asar');
  console.log('  ✓ resources/app.asar');

  // List ASAR contents (normalise backslashes to forward slashes)
  const entries = await listPackage(asarPath);
  const entryPaths = entries.map((p) => p.replace(/\\/g, '/').replace(/^\//, ''));

  // Required build bundles
  const required = [
    '.vite/build/main.cjs',
    '.vite/build/preload.cjs',
    '.vite/build/hash-worker.cjs',
  ];
  for (const file of required) {
    if (!entryPaths.includes(file)) throw new Error(`Missing ${file} in app.asar`);
    console.log(`  ✓ ${file}`);
  }

  // Renderer HTML
  const rendererHtml = entryPaths.find(
    (p) => p.startsWith('.vite/renderer/') && p.endsWith('.html'),
  );
  if (rendererHtml === undefined) throw new Error('Missing renderer HTML in app.asar');
  console.log(`  ✓ ${rendererHtml}`);

  // Renderer JS
  const rendererJs = entryPaths.find((p) => p.startsWith('.vite/renderer/') && p.endsWith('.js'));
  if (rendererJs === undefined) throw new Error('Missing renderer JS in app.asar');
  console.log(`  ✓ ${rendererJs}`);

  // Renderer CSS
  const rendererCss = entryPaths.find((p) => p.startsWith('.vite/renderer/') && p.endsWith('.css'));
  if (rendererCss === undefined) throw new Error('Missing renderer CSS in app.asar');
  console.log(`  ✓ ${rendererCss}`);

  // Architecture fixtures not packaged
  const hasArchFixture = entryPaths.some((p) => p.includes('tests/fixtures/architecture'));
  if (hasArchFixture) throw new Error('Package contains architecture fixtures');
  console.log('  ✓ architecture fixtures excluded');

  // Test files not packaged
  const hasTestFile = entryPaths.some(
    (p) => p.includes('.test.') || p.includes('.spec.') || p.includes('__tests__'),
  );
  if (hasTestFile) throw new Error('Package contains test files');
  console.log('  ✓ test files excluded');

  // .env not packaged
  if (entryPaths.some((p) => p.endsWith('.env'))) {
    throw new Error('Package contains .env files');
  }
  console.log('  ✓ .env files excluded');

  // Database files not packaged
  if (entryPaths.some((p) => p.endsWith('.db') || p.endsWith('.sqlite'))) {
    throw new Error('Package contains database files');
  }
  console.log('  ✓ database files excluded');

  // Logs not packaged
  if (entryPaths.some((p) => p.startsWith('logs/'))) {
    throw new Error('Package contains logs');
  }
  console.log('  ✓ logs excluded');

  console.log(`\nVerified: ${pkgDir}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
