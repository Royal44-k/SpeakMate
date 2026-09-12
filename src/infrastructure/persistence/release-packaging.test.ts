import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { relative, resolve } from 'node:path'
import { expect, it } from 'vitest'
import ts from 'typescript'

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
    'src/infrastructure/persistence/recovery.test.ts',
    'src/features/profile/learning-center.test.tsx',
    'src/test/setup.ts',
    'vitest.config.ts',
    'playwright.config.ts',
    'next-env.d.ts',
  ]) {
    expect(rules.ignores(file), file).toBe(true)
  }
})

it('retained TypeScript build inputs do not reference local modules excluded from the source upload', () => {
  const rules = ignore().add(readFileSync(resolve('.vercelignore'), 'utf8'))
  const root = resolve('.')
  const retained = (file: string) => {
    const path = relative(root, file).replaceAll('\\', '/')
    // Installed dependencies are resolved after install, not source uploads.
    return (
      path.startsWith('../') ||
      path.startsWith('node_modules/') ||
      !rules.ignores(path)
    )
  }
  const config = ts.readConfigFile(resolve('tsconfig.json'), ts.sys.readFile)
  expect(config.error).toBeUndefined()
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
  expect(parsed.errors).toEqual([])
  const maskedHost: ts.ModuleResolutionHost = {
    ...ts.sys,
    fileExists: (file) => retained(file) && ts.sys.fileExists(file),
    readFile: (file) => (retained(file) ? ts.sys.readFile(file) : undefined),
  }
  const missing: string[] = []
  for (const file of parsed.fileNames.filter(retained)) {
    for (const imported of ts.preProcessFile(readFileSync(file, 'utf8'))
      .importedFiles) {
      const full = ts.resolveModuleName(
        imported.fileName,
        file,
        parsed.options,
        ts.sys,
      ).resolvedModule
      if (!full || full.isExternalLibraryImport) continue
      const packaged = ts.resolveModuleName(
        imported.fileName,
        file,
        parsed.options,
        maskedHost,
      ).resolvedModule
      if (!packaged || !retained(full.resolvedFileName)) {
        missing.push(`${relative(root, file)} -> ${imported.fileName}`)
      }
    }
  }
  expect(missing, 'Retained source references excluded local modules').toEqual(
    [],
  )
})
