const { createHash } = require('node:crypto');
const { existsSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { app, utilityProcess } = require('electron');

const outputDirectory = join(__dirname, '../../apps/desktop/out');
const packageDirectory = readdirSync(outputDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.endsWith('-win32-x64'))
  .map((entry) => join(outputDirectory, entry.name))
  .sort()
  .at(-1);
const workerPath = join(packageDirectory ?? '', 'resources', 'app.asar', '.vite', 'build', 'hash-worker.cjs');
const value = 'S01 integration utility process';
const expectedDigest = createHash('sha256').update(value, 'utf8').digest('hex');

if (!existsSync(workerPath)) {
  throw new Error(`Missing utility process bundle: ${workerPath}`);
}

async function run() {
  await app.whenReady();
  const worker = utilityProcess.fork(workerPath, [], { sandbox: false });
  const requestId = '0a8d2ce5-8a93-49bc-aef7-4c5bb6e1c427';

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Utility process integration test timed out.')),
      5_000,
    );
    worker.on('message', (message) => {
      if (message?.kind === 'utility-ready') {
        worker.postMessage({ kind: 'diagnostic-hash-request', requestId, input: { text: value } });
        return;
      }
      clearTimeout(timeout);
        if (
         message?.kind !== 'diagnostic-hash-success' ||
         message.requestId !== requestId ||
         message.result?.algorithm !== 'sha256' ||
         message.result?.digest !== expectedDigest
      ) {
        reject(new Error('Utility process returned an invalid SHA-256 result.'));
        return;
      }
      resolve();
    });
    worker.once('error', reject);
    worker.once('exit', (code) => reject(new Error(`Utility process exited before responding (${code}).`)));
  });

  worker.kill();
}

void run()
  .then(() => app.quit())
  .catch((error) => {
    console.error(error);
    app.exit(1);
  });
