import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const outputDirectory = join(process.cwd(), 'apps', 'desktop', 'out');
const packageDirectory = readdirSync(outputDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.endsWith('-win32-x64'))
  .map((entry) => join(outputDirectory, entry.name))
  .sort()
  .at(-1);

if (packageDirectory === undefined) {
  throw new Error('No Windows x64 Electron package was found under out/.');
}

const requiredFiles = [join(packageDirectory, 'resources', 'app.asar')];

const executable = readdirSync(packageDirectory, { withFileTypes: true }).some(
  (entry) => entry.isFile() && entry.name.endsWith('.exe'),
);

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Packaged application is missing ${file}.`);
  }
}

if (!executable) {
  throw new Error(`Packaged application is missing its executable in ${packageDirectory}.`);
}

console.log(`Verified packaged application: ${packageDirectory}`);
