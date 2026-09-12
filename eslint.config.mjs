import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    '.worktrees/**',
    // Private orchestration/runtime snapshots are generated, not app source.
    '.superpowers/**',
    '.next/**',
    '.next-recovery/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    // Interrupted browser runs retain downloaded, minified trace resources.
    'outputs/**/.playwright-artifacts-*/**',
  ]),
])
