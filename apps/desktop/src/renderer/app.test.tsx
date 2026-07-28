/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';

import type { DesktopApi } from '@kwe/contracts';

import { App } from './app.js';

function createNeverResolver<T>(): () => Promise<T> {
  return () => new Promise<T>(() => {});
}

function mockProjects(overrides?: Partial<DesktopApi['projects']>): void {
  const defaultProjects: DesktopApi['projects'] = {
    getActive: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    open: vi.fn(),
  };

  (window as { kwe?: DesktopApi }).kwe = {
    app: {
      getInfo: vi.fn(),
    },
    system: {
      computeDiagnosticHash: vi.fn(),
    },
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
      getActive: createNeverResolver(),
    });

    render(<App />);

    expect(screen.getByText('Loading...')).toBeDefined();
    expect(screen.getByText('Checking for an open project.')).toBeDefined();
  });

  it('shows empty state with buttons when no active project', async () => {
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

    expect(screen.getByText(/create project/i)).toBeDefined();
    expect(screen.getByLabelText('Project name')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter project name')).toBeDefined();
  });

  it('shows create-pending state', async () => {
    mockProjects({
      getActive: vi.fn().mockResolvedValue(null),
      create: createNeverResolver(),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No project open')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Create project'));
    fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Select folder'));

    await waitFor(() => {
      expect(screen.getByText('Creating project...')).toBeDefined();
    });
  });

  it('shows open-pending state', async () => {
    mockProjects({
      getActive: vi.fn().mockResolvedValue(null),
      open: createNeverResolver(),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No project open')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Open project'));

    await waitFor(() => {
      expect(screen.getByText('Opening project...')).toBeDefined();
    });
  });

  it('restores empty after create cancellation', async () => {
    mockProjects({
      getActive: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ status: 'cancelled' }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No project open')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Create project'));
    fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Select folder'));

    await waitFor(() => {
      expect(screen.getByText('No project open')).toBeDefined();
    });
  });

  it('restores empty after open cancellation', async () => {
    mockProjects({
      getActive: vi.fn().mockResolvedValue(null),
      open: vi.fn().mockResolvedValue({ status: 'cancelled' }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No project open')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Open project'));

    await waitFor(() => {
      expect(screen.getByText('No project open')).toBeDefined();
    });
  });

  it('displays active project', async () => {
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
    expect(screen.getByText('550e8400-e29b-41d4-a716-446655440000')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
  });

  it.each([
    ['PROJECT_NAME_INVALID', 'The project name is invalid'],
    ['PROJECT_ALREADY_EXISTS', 'A project already exists'],
    ['PROJECT_MANIFEST_NOT_FOUND', 'No project manifest found'],
    ['PROJECT_MANIFEST_INVALID', 'The project manifest is invalid'],
    ['PROJECT_VERSION_UNSUPPORTED', 'project manifest version is not supported'],
    ['PROJECT_PATH_INVALID', 'The selected folder path is not valid'],
  ])('shows error message for code %s', async (code, expectedMessage) => {
    mockProjects({
      getActive: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ status: 'failed', error: { code } }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No project open')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Create project'));
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

    expect(
      screen.getByText('Unable to check for an active project. Restart the application.'),
    ).toBeDefined();
  });

  it('does not render source-import controls', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No project open')).toBeDefined();
    });

    expect(screen.queryByText(/source/i)).toBeNull();
    expect(screen.queryByText(/import/i)).toBeNull();
    expect(screen.queryByText(/upload/i)).toBeNull();
    expect(screen.queryByText(/url/i)).toBeNull();
    expect(screen.queryByText(/document/i)).toBeNull();
    expect(screen.queryByText(/fetch/i)).toBeNull();
  });
});
