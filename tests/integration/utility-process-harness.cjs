const { createHash } = require('node:crypto');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { app, utilityProcess } = require('electron');

const workerPath = join(__dirname, '../../apps/desktop/.vite/build/hash-worker.cjs');
const value = 'S01 integration utility process';
const expectedDigest = createHash('sha256').update(value, 'utf8').digest('hex');

if (!existsSync(workerPath)) {
  throw new Error(`Missing utility process bundle: ${workerPath}`);
}

async function run() {
  await app.whenReady();
  const worker = utilityProcess.fork(workerPath);
  const requestId = '0a8d2ce5-8a93-49bc-aef7-4c5bb6e1c427';

  await new Promise((resolve, reject) => {
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Utility process integration test timed out.'));
    }, 5_000);

    worker.on('message', (message) => {
      if (message?.kind === 'utility-ready') {
        worker.postMessage({
          kind: 'diagnostic-hash-request',
          requestId,
          input: { text: value },
        });
        return;
      }

      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (
        message?.kind === 'diagnostic-hash-success' &&
        message.requestId === requestId &&
        message.result?.algorithm === 'sha256' &&
        message.result?.digest === expectedDigest
      ) {
        resolve();
      } else {
        reject(new Error('Utility process returned an invalid SHA-256 result.'));
      }
    });

    worker.once('error', (type) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error('Utility process integration error.'));
    });

    worker.once('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error(`Utility process exited before responding (${code}).`));
    });
  });
}

void run()
  .then(() => app.quit())
  .catch(() => app.exit(1));

