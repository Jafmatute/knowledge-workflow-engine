import { useCallback, useEffect, useRef, useState } from 'react';

import type { ActiveProjectDto, CreateProjectResult, OpenProjectResult } from '@kwe/contracts';

type PageState =
  | { status: 'loading' }
  | { status: 'startup-error'; message: string }
  | { status: 'empty' }
  | { status: 'create-form' }
  | { status: 'create-pending' }
  | { status: 'open-pending' }
  | { status: 'active'; project: ActiveProjectDto }
  | { status: 'error'; message: string };

function getProjectErrorMessage(code: string): string {
  switch (code) {
    case 'PROJECT_NAME_INVALID':
      return 'The project name is invalid. Enter a non-empty name up to 100 characters.';
    case 'PROJECT_ALREADY_EXISTS':
      return 'A project already exists at the selected location.';
    case 'PROJECT_MANIFEST_NOT_FOUND':
      return 'No project manifest found in the selected folder.';
    case 'PROJECT_MANIFEST_INVALID':
      return 'The project manifest is invalid or corrupted.';
    case 'PROJECT_VERSION_UNSUPPORTED':
      return 'The project manifest version is not supported by this application.';
    case 'PROJECT_PATH_INVALID':
      return 'The selected folder path is not valid.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

function getErrorCode(result: CreateProjectResult | OpenProjectResult): string | null {
  if ('error' in result && result.status === 'failed') {
    return result.error.code;
  }
  return null;
}

export function App() {
  const [page, setPage] = useState<PageState>({ status: 'loading' });
  const [projectName, setProjectName] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void window.kwe.projects
      .getActive()
      .then((result) => {
        if (!active) return;
        if (result !== null) {
          setPage({ status: 'active', project: result });
        } else {
          setPage({ status: 'empty' });
        }
      })
      .catch(() => {
        if (active) {
          setPage({
            status: 'startup-error',
            message: 'Unable to check for an active project. Restart the application.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    setPage({ status: 'create-pending' });

    try {
      const result: CreateProjectResult = await window.kwe.projects.create({ name: projectName });

      if (!mountedRef.current) return;

      if (result.status === 'created') {
        setPage({ status: 'active', project: result.project });
        setProjectName('');
      } else if (result.status === 'cancelled') {
        setPage({ status: 'empty' });
        setProjectName('');
      } else {
        const code = getErrorCode(result) ?? 'PROJECT_IO_FAILED';
        setPage({ status: 'error', message: getProjectErrorMessage(code) });
      }
    } catch {
      if (mountedRef.current) {
        setPage({ status: 'error', message: 'An unexpected error occurred. Please try again.' });
      }
    }
  }, [projectName]);

  const handleOpen = useCallback(async () => {
    setPage({ status: 'open-pending' });

    try {
      const result: OpenProjectResult = await window.kwe.projects.open();

      if (!mountedRef.current) return;

      if (result.status === 'opened') {
        setPage({ status: 'active', project: result.project });
      } else if (result.status === 'cancelled') {
        setPage({ status: 'empty' });
      } else {
        const code = getErrorCode(result) ?? 'PROJECT_IO_FAILED';
        setPage({ status: 'error', message: getProjectErrorMessage(code) });
      }
    } catch {
      if (mountedRef.current) {
        setPage({ status: 'error', message: 'An unexpected error occurred. Please try again.' });
      }
    }
  }, []);

  const goToEmpty = useCallback(() => {
    setPage({ status: 'empty' });
    setProjectName('');
  }, []);

  if (page.status === 'loading') {
    return (
      <main className="shell" aria-labelledby="shell-title">
        <section className="shell__panel" aria-live="polite">
          <p className="shell__eyebrow">Knowledge Workflow Engine</p>
          <h1 id="shell-title">Loading...</h1>
          <p>Checking for an open project.</p>
        </section>
      </main>
    );
  }

  if (page.status === 'startup-error') {
    return (
      <main className="shell" aria-labelledby="shell-title">
        <section className="shell__panel" aria-live="polite">
          <p className="shell__eyebrow">Knowledge Workflow Engine</p>
          <h1 id="shell-title">Startup error</h1>
          <p>{page.message}</p>
        </section>
      </main>
    );
  }

  if (page.status === 'empty') {
    return (
      <main className="shell" aria-labelledby="shell-title">
        <section className="shell__panel" aria-live="polite">
          <p className="shell__eyebrow">Knowledge Workflow Engine</p>
          <h1 id="shell-title">No project open</h1>
          <p>Create a new project or open an existing one to get started.</p>
          <div className="shell__actions">
            <button
              type="button"
              className="shell__action"
              onClick={() => setPage({ status: 'create-form' })}
            >
              Create project
            </button>
            <button type="button" className="shell__action" onClick={handleOpen}>
              Open project
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (page.status === 'create-form') {
    return (
      <main className="shell" aria-labelledby="shell-title">
        <section className="shell__panel" aria-live="polite">
          <p className="shell__eyebrow">Knowledge Workflow Engine</p>
          <h1 id="shell-title">Create project</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleCreateSubmit();
            }}
          >
            <div className="shell__field">
              <label htmlFor="project-name">Project name</label>
              <input
                id="project-name"
                type="text"
                className="shell__input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                autoFocus
              />
            </div>
            <div className="shell__actions">
              <button type="submit" className="shell__action">
                Select folder
              </button>
              <button
                type="button"
                className="shell__action shell__action--secondary"
                onClick={goToEmpty}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  if (page.status === 'create-pending') {
    return (
      <main className="shell" aria-labelledby="shell-title">
        <section className="shell__panel" aria-live="polite">
          <p className="shell__eyebrow">Knowledge Workflow Engine</p>
          <h1 id="shell-title">Creating project...</h1>
          <p>Select a folder for your project.</p>
        </section>
      </main>
    );
  }

  if (page.status === 'open-pending') {
    return (
      <main className="shell" aria-labelledby="shell-title">
        <section className="shell__panel" aria-live="polite">
          <p className="shell__eyebrow">Knowledge Workflow Engine</p>
          <h1 id="shell-title">Opening project...</h1>
          <p>Select the project folder.</p>
        </section>
      </main>
    );
  }

  if (page.status === 'error') {
    return (
      <main className="shell" aria-labelledby="shell-title">
        <section className="shell__panel" aria-live="polite">
          <p className="shell__eyebrow">Knowledge Workflow Engine</p>
          <h1 id="shell-title">Error</h1>
          <p className="shell__error-text">{page.message}</p>
          <div className="shell__actions">
            <button type="button" className="shell__action" onClick={goToEmpty}>
              Create project
            </button>
            <button type="button" className="shell__action" onClick={handleOpen}>
              Open project
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell" aria-labelledby="shell-title">
      <section className="shell__panel" aria-live="polite">
        <p className="shell__eyebrow">Knowledge Workflow Engine</p>
        <h1 id="shell-title">{page.project.name}</h1>
        <div className="shell__project-info">
          <p>
            <span className="shell__label">Root folder:</span>{' '}
            <code className="shell__path">{page.project.rootPath}</code>
          </p>
          <p>
            <span className="shell__label">Workspace schema version:</span>{' '}
            {page.project.schemaVersion}
          </p>
          <p>
            <span className="shell__label">Project ID:</span>{' '}
            <code className="shell__path">{page.project.projectId}</code>
          </p>
        </div>
        <div className="shell__actions">
          <button type="button" className="shell__action" onClick={handleOpen}>
            Open another project
          </button>
          <button
            type="button"
            className="shell__action shell__action--secondary"
            onClick={goToEmpty}
          >
            Create project
          </button>
        </div>
      </section>
    </main>
  );
}
