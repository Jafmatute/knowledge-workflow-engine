import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { extractFile, listPackage } from '@electron/asar';

import {
  APP_EXE,
  findPackagedApplicationExecutable,
  findWindowsX64PackageDirectory,
} from './package-layout.mjs';

const OUTPUT_DIR = join(process.cwd(), 'apps', 'desktop', 'out');
const RENDERER_ROOT = '.vite/renderer/main_window';
const HTML_PATH = `${RENDERER_ROOT}/index.html`;

/**
 * Extract a file from the ASAR using its forward-slash path.
 * extractFile expects native path separators on disk.
 */
function extractAsarFile(asarPath, forwardPath) {
  const nativePath = forwardPath.replace(/\//g, '\\');
  return extractFile(asarPath, nativePath);
}

async function main() {
  const pkgDir = findWindowsX64PackageDirectory(OUTPUT_DIR);
  const exePath = findPackagedApplicationExecutable(pkgDir);

  console.log(`  ✓ ${APP_EXE}  (${exePath})`);

  // Resources
  const resourcesDir = join(pkgDir, 'resources');
  if (!existsSync(resourcesDir)) throw new Error('Missing resources directory');
  console.log('  ✓ resources/');

  const asarPath = join(resourcesDir, 'app.asar');
  if (!existsSync(asarPath)) throw new Error('Missing app.asar');
  console.log('  ✓ resources/app.asar');

  // List ASAR contents
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

  // Renderer root layout — index.html at the root of main_window
  if (!entryPaths.includes(HTML_PATH)) {
    throw new Error(`Missing renderer HTML at ${HTML_PATH}`);
  }
  console.log(`  ✓ ${HTML_PATH}`);

  // Find generated JS and CSS under assets/
  const rendererJs = entryPaths.find(
    (p) => p.startsWith(`${RENDERER_ROOT}/assets/`) && p.endsWith('.js'),
  );
  if (rendererJs === undefined) throw new Error('Missing renderer JS under assets/');
  console.log(`  ✓ ${rendererJs}`);

  const rendererCss = entryPaths.find(
    (p) => p.startsWith(`${RENDERER_ROOT}/assets/`) && p.endsWith('.css'),
  );
  if (rendererCss === undefined) throw new Error('Missing renderer CSS under assets/');
  console.log(`  ✓ ${rendererCss}`);

  // Verify generated HTML references only existing local assets
  const htmlContent = extractAsarFile(asarPath, HTML_PATH).toString('utf8');

  // Collect src and href values from <script> and <link> tags
  const scriptSrcs = [...htmlContent.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  const linkHrefs = [...htmlContent.matchAll(/<link[^>]+href="([^"]+)"/g)].map((m) => m[1]);
  const references = [...scriptSrcs, ...linkHrefs];

  for (const ref of references) {
    // Reject absolute network URLs
    if (/^https?:\/\//.test(ref)) {
      throw new Error(`Generated HTML references external URL: ${ref}`);
    }
    // Reject file: URLs
    if (/^file:\/\//.test(ref)) {
      throw new Error(`Generated HTML references file: URL: ${ref}`);
    }
    // Resolve relative/root-relative URLs
    const resolved = ref.startsWith('./') ? ref.slice(2) : ref.startsWith('/') ? ref.slice(1) : ref;
    const assetPath = `${RENDERER_ROOT}/${resolved}`;
    if (!entryPaths.includes(assetPath)) {
      throw new Error(`Generated HTML references missing asset: ${ref} → ${assetPath} not in ASAR`);
    }
    console.log(`  ✓ HTML references existing asset: ${ref}`);
  }

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
