import { useEffect, useState } from 'react';

type AppInfoState =
  { status: 'loading' } | { status: 'ready'; version: string } | { status: 'error' };

export function App() {
  const [appInfo, setAppInfo] = useState<AppInfoState>({ status: 'loading' });

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
      </section>
    </main>
  );
}
