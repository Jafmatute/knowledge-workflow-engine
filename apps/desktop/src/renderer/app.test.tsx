/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';

import type { DesktopApi } from '@kwe/contracts';

import { App } from './app.js';

function mockProjects(overrides?: Partial<DesktopApi['projects']>): void {
  const defaultProjects: DesktopApi['projects'] = {
    getActive: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    open: vi.fn(),
  };

  (window as { kwe?: DesktopApi }).kwe = {
    app: { getInfo: vi.fn() },
    system: { computeDiagnosticHash: vi.fn() },
    projects: { ...defaultProjects, ...overrides },
  };
}

beforeEach(() => {
  mockProjects();
});

afterEach(() => {
  cleanup();
});

describe('App', () => {
  it('shows loading state on mount', () => {
    mockProjects({
      getActive: () => new Promise(() => {}),
    });

    render(<App />);

    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('shows empty state with create and open buttons', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No project open')).toBeDefined();
    });

    expect(screen.getByText('Create project')).toBeDefined();
    expect(screen.getByText('Open project')).toBeDefined();
  });

  it('shows create form with input', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No project open')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Create project'));

    await waitFor(() => {
      expect(screen.getByText(/create project/i)).toBeDefined();
    });

    expect(screen.getByLabelText('Project name')).toBeDefined();
  });

  it('shows create-pending state', async () => {
    mockProjects({
      getActive: vi.fn().mockResolvedValue(null),
      create: () => new Promise(() => {}),
    });

    render(<App />);

    await waitFor(() => expect(screen.getByText('No project open')).toBeDefined());

    fireEvent.click(screen.getByText('Create project'));
    await waitFor(() => expect(screen.getByText(/create project/i)).toBeDefined());

    fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Select folder'));

    await waitFor(() => {
      expect(screen.getByText('Creating project...')).toBeDefined();
    });
  });

  it('shows open-pending state', async () => {
    mockProjects({
      getActive: vi.fn().mockResolvedValue(null),
      open: () => new Promise(() => {}),
    });

    render(<App />);

    await waitFor(() => expect(screen.getByText('No project open')).toBeDefined());

    fireEvent.click(screen.getByText('Open project'));

    await waitFor(() => {
      expect(screen.getByText('Opening project...')).toBeDefined();
    });
  });

  it('create cancellation returns to create-form preserving name', async () => {
    mockProjects({
      getActive: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ status: 'cancelled' }),
    });

    render(<App />);

    await screen.findByText('No project open');

    fireEvent.click(screen.getByText('Create project'));
    await screen.findByLabelText('Project name');

    const input = screen.getByLabelText('Project name');
    fireEvent.change(input, { target: { value: 'Test' } });
    await screen.findByDisplayValue('Test');

    fireEvent.click(screen.getByText('Select folder'));

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Project name') as HTMLInputElement;
      expect(nameInput.value).toBe('Test');
    });
  });

  it('open cancellation from empty returns to empty', async () => {
    mockProjects({
      getActive: vi.fn().mockResolvedValue(null),
      open: vi.fn().mockResolvedValue({ status: 'cancelled' }),
    });

    render(<App />);

    await waitFor(() => expect(screen.getByText('No project open')).toBeDefined());

    fireEvent.click(screen.getByText('Open project'));

    await waitFor(() => {
      expect(screen.getByText('No project open')).toBeDefined();
    });
  });

  it('open cancellation from active returns to active project', async () => {
    const project = {
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Existing',
      rootPath: '/path',
      schemaVersion: 1 as const,
    };

    const openFn = vi.fn().mockResolvedValue({ status: 'cancelled' });

    mockProjects({
      getActive: vi.fn().mockResolvedValue(project),
      open: openFn,
    });

    render(<App />);

    await waitFor(() => expect(screen.getByText('Existing')).toBeDefined());

    fireEvent.click(screen.getByText('Open another project'));

    await waitFor(() => {
      expect(screen.getByText('Existing')).toBeDefined();
    });
  });

  it('displays active project details', async () => {
    const project = {
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'My Test Project',
      rootPath: '/some/path',
      schemaVersion: 1 as const,
    };

    mockProjects({
      getActive: vi.fn().mockResolvedValue(project),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('My Test Project')).toBeDefined();
    });

    expect(screen.getByText('/some/path')).toBeDefined();
  });

  it.each([
    ['PROJECT_NAME_INVALID', 'The project name is invalid'],
    ['PROJECT_ALREADY_EXISTS', 'A project already exists'],
    ['PROJECT_MANIFEST_NOT_FOUND', 'No project manifest found'],
    ['PROJECT_MANIFEST_INVALID', 'The project manifest is invalid'],
    ['PROJECT_VERSION_UNSUPPORTED', 'project manifest version is not supported'],
    ['PROJECT_PATH_INVALID', 'The selected folder path is not valid'],
    ['PROJECT_IO_FAILED', 'An unexpected error occurred'],
  ])('shows error message for code %s', async (code, expectedMessage) => {
    mockProjects({
      getActive: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ status: 'failed', error: { code } }),
    });

    render(<App />);

    await waitFor(() => expect(screen.getByText('No project open')).toBeDefined());

    fireEvent.click(screen.getByText('Create project'));
    await waitFor(() => expect(screen.getByText(/create project/i)).toBeDefined());
    fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Select folder'));

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeDefined();
    });

    expect(screen.getByText((content: string) => content.includes(expectedMessage))).toBeDefined();
  });

  it('shows startup error when getActive fails', async () => {
    mockProjects({
      getActive: vi.fn().mockRejectedValue(new Error('fail')),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Startup error')).toBeDefined();
    });
  });

  it('does not render source-import controls', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByText('No project open')).toBeDefined());

    expect(screen.queryByText(/import/i)).toBeNull();
    expect(screen.queryByText(/upload/i)).toBeNull();
    expect(screen.queryByText(/url/i)).toBeNull();
    expect(screen.queryByText(/fetch/i)).toBeNull();
  });
});
