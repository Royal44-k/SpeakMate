import { expect, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { spawn, type ChildProcess } from 'node:child_process'

/** Only tests owned by this QA lane use 3132, serially, against a frozen build. */
export function registerOwnedLocalServer() {
  const origin = 'http://127.0.0.1:3132'
  let server: ChildProcess | undefined
  let buildId = ''
  const output: string[] = []
  test.use({ baseURL: origin })
  test.beforeAll(async () => {
    buildId = (await readFile('.next/BUILD_ID', 'utf8')).trim()
    if (process.env.TASK7_EXPECT_BUILD_ID)
      expect(buildId).toBe(process.env.TASK7_EXPECT_BUILD_ID)
    try {
      await fetch(`${origin}/api/v1/health`)
      throw new Error('Refuse occupied QA port3132')
    } catch (error) {
      if (!(error instanceof TypeError)) throw error
    }
    server = spawn(
      process.execPath,
      [
        'node_modules/next/dist/bin/next',
        'start',
        '-H',
        '127.0.0.1',
        '-p',
        '3132',
      ],
      {
        cwd: process.cwd(),
        env: { ...process.env, NEXT_PUBLIC_RECOVERY_ONLY: '' },
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    server.stdout?.on('data', (data) => output.push(String(data)))
    server.stderr?.on('data', (data) => output.push(String(data)))
    await expect
      .poll(
        async () => {
          try {
            return (await (await fetch(`${origin}/api/v1/health`)).json()).mode
          } catch {
            return 'not-ready'
          }
        },
        { timeout: 30000 },
      )
      .toBe('local-learning')
  })
  test.afterAll(async ({}, info) => {
    const owned = server
    server = undefined
    if (owned && owned.exitCode === null)
      await new Promise<void>((resolve) => {
        owned.once('exit', () => resolve())
        owned.kill('SIGTERM')
      })
    await writeFile(info.outputPath('owned-server.log'), output.join(''))
  })
  return { origin, buildId: () => buildId }
}
