import { useEffect, useState } from 'react';

type AppInfoState =
  { status: 'loading' } | { status: 'ready'; version: string } | { status: 'error' };
type HashState =
  { status: 'idle' } | { status: 'running' } | { status: 'ready' } | { status: 'error' };

export function App() {
  const [appInfo, setAppInfo] = useState<AppInfoState>({ status: 'loading' });
  const [hash, setHash] = useState<HashState>({ status: 'idle' });

  useEffect(() => {
    let active = true;

    void window.kwe.app
      .getInfo({})
      .then((info) => {
        if (active) {
          setAppInfo({ status: 'ready', version: info.version });
        }
      })
      .catch(() => {
        if (active) {
          setAppInfo({ status: 'error' });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const verifyUtilityProcess = () => {
    setHash({ status: 'running' });
    void window.kwe.system
      .computeDiagnosticHash({ text: 'knowledge-workflow-engine' })
      .then(() => setHash({ status: 'ready' }))
      .catch(() => setHash({ status: 'error' }));
  };

  return (
    <main className="shell" aria-labelledby="shell-title">
      <section className="shell__panel" aria-live="polite">
        <p className="shell__eyebrow">Knowledge Workflow Engine</p>
        <h1 id="shell-title">Secure desktop shell ready</h1>
        {appInfo.status === 'loading' ? <p>Loading application information...</p> : null}
        {appInfo.status === 'ready' ? <p>Application version: {appInfo.version}</p> : null}
        {appInfo.status === 'error' ? (
          <p className="shell__error">
            Unable to load the application version. Restart the application.
          </p>
        ) : null}
        <button
          type="button"
          className="shell__action"
          onClick={verifyUtilityProcess}
          disabled={hash.status === 'running'}
        >
          Verify utility process
        </button>
        {hash.status === 'running' ? <p>Calculating SHA-256...</p> : null}
        {hash.status === 'ready' ? <p>Utility process: Ready</p> : null}
        {hash.status === 'error' ? (
          <p className="shell__error">Unable to calculate the SHA-256 hash.</p>
        ) : null}
      </section>
    </main>
  );
}
