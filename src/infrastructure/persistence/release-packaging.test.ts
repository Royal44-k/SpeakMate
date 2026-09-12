import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

// Use the already-installed gitignore parser, not a test-specific glob implementation.
const localRequire = createRequire(import.meta.url)
const eslintRequire = createRequire(localRequire.resolve('eslint/package.json'))
const ignore = eslintRequire('ignore') as () => {
  add(text: string): { ignores(path: string): boolean }
}

it('includes every local build entrypoint while excluding development and private artifacts from source packaging', () => {
  const rules = ignore().add(readFileSync(resolve('.vercelignore'), 'utf8'))
  const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
  const buildScripts = [
    ...pkg.scripts.build.matchAll(/node\s+(scripts\/[\w.-]+)/g),
  ].map((match) => match[1])
  expect(buildScripts).not.toHaveLength(0)
  for (const file of [
    ...buildScripts,
    'package.json',
    'pnpm-lock.yaml',
    'next.config.ts',
    'src/app/layout.tsx',
    'public/sw.js',
  ]) {
    expect(existsSync(resolve(file)), file).toBe(true)
    expect(rules.ignores(file), file).toBe(false)
  }
  for (const file of [
    'scripts/dev-only.mjs',
    'tests/e2e/offline.spec.ts',
    'docs/private.md',
    '.superpowers/sdd/plan.md',
    '.superpowers/runtime/node.exe',
    '.agents/private.md',
    '.codex/config.toml',
    '.env.local',
    '.env.production',
    '.vercel/project.json',
    '.git/config',
    '.next/server/app/page.js',
    '.next-recovery/server/app/page.js',
    'node_modules/package/index.js',
    'outputs/qa/synthetic.png',
    'playwright-report/index.html',
    'test-results/result.json',
    'runtime.zip',
  ]) {
    expect(rules.ignores(file), file).toBe(true)
  }
})
