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
      comment: 'Domain source cannot depend on another workspace package or desktop code.',
      severity: 'error',
      from: { path: '(^|/)packages/domain/src/', pathNot: '\\.(test|spec)\\.ts$' },
      to: {
        path: '(^|/)(packages/(application|contracts|infrastructure|workflows|schemas|test-support)/src|apps/)',
      },
    },
    {
      name: 'domain-cannot-use-external-runtime-libraries',
      comment: 'Domain source cannot depend on npm packages or Node runtime modules.',
      severity: 'error',
      from: { path: '(^|/)packages/domain/src/', pathNot: '\\.(test|spec)\\.ts$' },
      to: { dependencyTypes: ['core', 'npm'] },
    },
    {
      name: 'application-cannot-import-infrastructure-or-desktop',
      comment:
        'Application source depends on domain and contracts, never adapters or desktop code.',
      severity: 'error',
      from: { path: '(^|/)packages/application/src/', pathNot: '\\.(test|spec)\\.ts$' },
      to: { path: '(^|/)(packages/infrastructure/src|apps/)' },
    },
    {
      name: 'contracts-cannot-import-infrastructure-or-desktop',
      comment: 'Contracts remain independent from infrastructure implementations and desktop code.',
      severity: 'error',
      from: { path: '(^|/)packages/contracts/src/', pathNot: '\\.(test|spec)\\.ts$' },
      to: { path: '(^|/)(packages/infrastructure/src|apps/)' },
    },
    {
      name: 'workflows-cannot-import-infrastructure-or-desktop',
      comment: 'Workflows cannot depend on provider adapters, renderers, or desktop code.',
      severity: 'error',
      from: { path: '(^|/)packages/workflows/src/', pathNot: '\\.(test|spec)\\.ts$' },
      to: { path: '(^|/)(packages/infrastructure/src|apps/)' },
    },
    {
      name: 'production-source-cannot-import-test-support',
      comment: 'Test support is available only to test files and root test suites.',
      severity: 'error',
      from: {
        path: '(^|/)packages/[^/]+/src/',
        pathNot: '\\.(test|spec)\\.ts$',
      },
      to: { path: '(^|/)packages/test-support/src/' },
    },
    {
      name: 'desktop-renderer-cannot-import-electron',
      comment: 'The renderer cannot access Electron directly.',
      severity: 'error',
      from: { path: '(^|/)apps/desktop/src/renderer/', pathNot: '\\.(test|spec)\\.ts$' },
      to: { path: '(^|/)node_modules/electron/' },
    },
    {
      name: 'desktop-renderer-cannot-import-unapproved-runtime-package',
      comment: 'The renderer only permits React and React DOM runtime packages.',
      severity: 'error',
      from: { path: '(^|/)apps/desktop/src/renderer/', pathNot: '\\.(test|spec)\\.ts$' },
      to: {
        dependencyTypes: ['npm', 'npm-no-pkg'],
        pathNot: '(^|/)node_modules/(react|react-dom)/',
      },
    },
    {
      name: 'desktop-renderer-cannot-import-node',
      comment: 'The renderer cannot access Node core modules.',
      severity: 'error',
      from: { path: '(^|/)apps/desktop/src/renderer/', pathNot: '\\.(test|spec)\\.ts$' },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'desktop-renderer-cannot-import-privileged-code',
      comment:
        'The renderer only depends on React, contracts, schemas, and local renderer modules.',
      severity: 'error',
      from: { path: '(^|/)apps/desktop/src/renderer/', pathNot: '\\.(test|spec)\\.ts$' },
      to: {
        path: '(^|/)(apps/desktop/src/(main|preload)/|packages/(domain|application|infrastructure|workflows|test-support)/src/)',
      },
    },
    {
      name: 'desktop-preload-cannot-import-product-or-renderer-code',
      comment: 'The preload exposes contracts, never renderer or product implementation code.',
      severity: 'error',
      from: { path: '(^|/)apps/desktop/src/preload/', pathNot: '\\.(test|spec)\\.ts$' },
      to: {
        path: '(^|/)(apps/desktop/src/(main|renderer)/|packages/(domain|application|infrastructure|workflows|test-support)/src/)',
      },
    },
    {
      name: 'desktop-preload-cannot-import-unapproved-runtime-package',
      comment: 'The preload only permits Electron as an external runtime package.',
      severity: 'error',
      from: { path: '(^|/)apps/desktop/src/preload/', pathNot: '\\.(test|spec)\\.ts$' },
      to: {
        dependencyTypes: ['npm', 'npm-no-pkg'],
        pathNot: '(^|/)node_modules/electron/',
      },
    },
    {
      name: 'desktop-main-cannot-import-product-code',
      comment: 'S01-B main code only hosts Electron, contracts, and schemas.',
      severity: 'error',
      from: { path: '(^|/)apps/desktop/src/main/', pathNot: '\\.(test|spec)\\.ts$' },
      to: {
        path: '(^|/)(apps/desktop/src/(renderer|preload)/|packages/(domain|application|infrastructure|workflows|test-support)/src/)',
      },
    },
    {
      name: 'desktop-main-cannot-import-unapproved-runtime-package',
      comment: 'S01-B main code only permits Electron and Node core modules.',
      severity: 'error',
      from: { path: '(^|/)apps/desktop/src/main/', pathNot: '\\.(test|spec)\\.ts$' },
      to: {
        dependencyTypes: ['npm', 'npm-no-pkg'],
        pathNot: '(^|/)node_modules/electron/',
      },
    },
    {
      name: 'desktop-production-source-cannot-import-test-support',
      comment: 'Desktop production source cannot import test support.',
      severity: 'error',
      from: {
        path: '(^|/)apps/desktop/src/',
        pathNot: '\\.(test|spec)\\.ts$',
      },
      to: { path: '(^|/)packages/test-support/src/' },
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
