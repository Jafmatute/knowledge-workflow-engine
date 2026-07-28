import { useCallback, useEffect, useState } from 'react';

import type { ActiveProject } from '@kwe/domain';

type PageState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'create-form' }
  | { status: 'creating' }
  | { status: 'active'; project: ActiveProject }
  | { status: 'error'; message: string };

type ProjectResult =
  | { status: 'created'; project: ActiveProject }
  | { status: 'opened'; project: ActiveProject }
  | { status: 'cancelled' };

function getProjectErrorCode(error: unknown): string {
  if (error instanceof Error && 'code' in error) {
    return (error as { code: string }).code;
  }
  return 'PROJECT_IO_FAILED';
}

function getErrorMessage(code: string): string {
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

export function App() {
  const [page, setPage] = useState<PageState>({ status: 'loading' });
  const [projectName, setProjectName] = useState('');

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
        if (active) setPage({ status: 'empty' });
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    setPage({ status: 'creating' });

    try {
      const result: ProjectResult = await window.kwe.projects.create({ name: projectName });

      if (result.status === 'created') {
        setPage({ status: 'active', project: result.project });
        setProjectName('');
      } else {
        setPage({ status: 'empty' });
        setProjectName('');
      }
    } catch (error) {
      const code = getProjectErrorCode(error);
      setPage({ status: 'error', message: getErrorMessage(code) });
    }
  }, [projectName]);

  const handleOpen = useCallback(async () => {
    try {
      const result: ProjectResult = await window.kwe.projects.open();

      if (result.status === 'opened') {
        setPage({ status: 'active', project: result.project });
      }
    } catch (error) {
      const code = getProjectErrorCode(error);
      setPage({ status: 'error', message: getErrorMessage(code) });
    }
  }, []);

  const handleCreateAnother = useCallback(() => {
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
                onClick={() => setPage({ status: 'empty' })}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  if (page.status === 'creating') {
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

  if (page.status === 'error') {
    return (
      <main className="shell" aria-labelledby="shell-title">
        <section className="shell__panel" aria-live="polite">
          <p className="shell__eyebrow">Knowledge Workflow Engine</p>
          <h1 id="shell-title">Error</h1>
          <p className="shell__error-text">{page.message}</p>
          <div className="shell__actions">
            <button type="button" className="shell__action" onClick={handleCreateAnother}>
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
            onClick={handleCreateAnother}
          >
            Create project
          </button>
        </div>
      </section>
    </main>
  );
}
