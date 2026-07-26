/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular-dependencies',
      comment: 'Circular dependencies obscure the modular boundaries.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-must-remain-independent',
      comment: 'The domain cannot depend on application, infrastructure, or desktop code.',
      severity: 'error',
      from: { path: '^packages/domain/src' },
      to: { path: '^(packages/(application|infrastructure)/src|apps/)' },
    },
    {
      name: 'domain-cannot-use-external-runtime-libraries',
      comment:
        'The domain cannot use UI, Electron, filesystem, HTTP, database, provider, or parser libraries.',
      severity: 'error',
      from: { path: '^packages/domain/src' },
      to: {
        path: '^(electron|react|vite|node:fs|node:http|node:https|better-sqlite3|drizzle-orm|openai|@google/genai)',
      },
    },
    {
      name: 'application-cannot-import-infrastructure',
      comment: 'Application depends on ports, never infrastructure adapters.',
      severity: 'error',
      from: { path: '^packages/application/src' },
      to: { path: '^packages/infrastructure/src' },
    },
    {
      name: 'contracts-cannot-import-infrastructure',
      comment: 'Contracts remain independent from infrastructure implementations.',
      severity: 'error',
      from: { path: '^packages/contracts/src' },
      to: { path: '^packages/infrastructure/src' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    reporterOptions: {
      dot: { collapsePattern: 'node_modules/[^/]+', theme: { graph: { splines: 'ortho' } } },
    },
  },
};
