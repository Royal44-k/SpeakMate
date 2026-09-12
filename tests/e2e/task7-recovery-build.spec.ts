import { expect, test, type Page, type BrowserContext } from '@playwright/test'
import { spawn, type ChildProcess } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import golden from '../fixtures/learner-export-v1.json' with { type: 'json' }
import { protect } from './task7-browser-helpers'

const origin = 'http://127.0.0.1:3131'
test.use({ baseURL: origin })
const stores = [
  'profile',
  'sessions',
  'turns',
  'favorites',
  'settings',
  'outbox',
  'notebook',
  'reviews',
  'dailyPlans',
  'learningEvents',
  'pointsLedger',
  'rewardUnlocks',
]

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('speakmate-v1')
      request.onupgradeneeded = () => {
        request.transaction!.abort()
        reject(new Error('Unexpected create'))
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      const names = Array.from(db.objectStoreNames)
      const tx = db.transaction(names, 'readonly')
      const rows = await Promise.all(
        names.map(
          (name) =>
            new Promise<[string, unknown[]]>((resolve, reject) => {
              const request = tx.objectStore(name).getAll()
              request.onsuccess = () => resolve([name, request.result])
              request.onerror = () => reject(request.error)
            }),
        ),
      )
      return { version: db.version, stores: Object.fromEntries(rows) }
    } finally {
      db.close()
    }
  })
}

test('Ruling29: actual v1 upgrade and learning → same-origin recovery build → explicit owned unregister → close/reopen → complete unchanged backup', async ({
  page,
  context,
  browser,
}, info) => {
  test.setTimeout(180000)
  const auditNetwork = await protect(context, origin)
  let server: ChildProcess | undefined
  let unknownContext: BrowserContext | undefined
  const output: string[] = []
  async function start(recovery: boolean) {
    try {
      await fetch(`${origin}/api/v1/health`)
      throw new Error('Refuse to reuse an occupied isolated port')
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
        '3131',
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NEXT_PUBLIC_RECOVERY_ONLY: recovery ? 'true' : '',
        },
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
      .toBe(recovery ? 'recovery-readonly' : 'local-learning')
  }
  async function stop() {
    if (!server) return
    const current = server
    server = undefined
    await new Promise<void>((resolve) => {
      current.once('exit', () => resolve())
      current.kill('SIGTERM')
    })
  }
  try {
    await start(false)
    await page.goto('/recovery')
    await expect(
      page.getByRole('heading', { name: '只读数据恢复' }),
    ).toBeVisible()
    expect(await page.evaluate(() => indexedDB.databases())).toEqual([])
    await page.evaluate(async (fixture) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('speakmate-v1', 1)
        request.onupgradeneeded = () => {
          const db = request.result
          for (const name of [
            'profile',
            'sessions',
            'turns',
            'favorites',
            'settings',
            'outbox',
          ]) {
            const store = db.createObjectStore(name, { keyPath: 'id' })
            if (name === 'sessions') {
              store.createIndex('by-status', 'status')
              store.createIndex('by-updated-at', 'updatedAt')
            }
            if (name === 'turns') store.createIndex('by-session', 'sessionId')
            const value = fixture[name as keyof typeof fixture]
            const rows =
              name === 'outbox'
                ? []
                : name === 'profile' || name === 'settings'
                  ? value
                    ? [value]
                    : []
                  : (value as unknown[])
            for (const row of rows) store.put(row)
          }
        }
        request.onsuccess = () => {
          request.result.close()
          resolve()
        }
        request.onerror = () => reject(request.error)
      })
    }, golden)
    const v1 = await snapshot(page)
    expect(v1.version).toBe(1)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
    const upgraded = await snapshot(page)
    expect(upgraded.version).toBe(2)
    for (const name of Object.keys(v1.stores))
      expect(upgraded.stores[name]).toEqual(v1.stores[name])
    expect(Object.keys(upgraded.stores).sort()).toEqual([...stores].sort())
    await page.getByRole('button', { name: '准备表达热身' }).click()
    await page.getByRole('button', { name: '隐藏参考，开始回忆' }).click()
    await page
      .getByRole('textbox', { name: '我的回忆', exact: true })
      .fill('I remember a useful expression.')
    await page.getByRole('button', { name: '确认完成热身' }).click()
    await expect(page.getByText('热身已完成，已保存这次回忆。')).toBeVisible()
    await page.getByRole('button', { name: '开始场景应用' }).click()
    await expect(
      page.getByRole('heading', { name: 'Dialogue Stage' }),
    ).toBeVisible()
    await page
      .getByRole('region', { name: '当前问题' })
      .getByRole('button', { name: '记录词句' })
      .last()
      .click()
    await page.getByRole('button', { name: '保存词句', exact: true }).click()
    await expect(page.getByText('已记录', { exact: true })).toBeVisible()
    await page.getByText('本题参考表达', { exact: true }).click()
    await page.getByRole('button', { name: '使用参考 1 并确认' }).click()
    await page.getByRole('button', { name: '提交这一轮' }).click()
    await expect(page.getByRole('textbox', { name: '英文内容' })).toBeHidden()
    await page.goto('/privacy')
    const expectedDownload = page.waitForEvent('download')
    await page.getByRole('button', { name: '导出学习数据' }).click()
    await (
      await expectedDownload
    ).saveAs(info.outputPath('normal-before-recovery.json'))
    const before = await snapshot(page)
    expect(before.stores.notebook.length).toBeGreaterThan(1)
    expect(before.stores.learningEvents.length).toBeGreaterThan(0)
    expect(before.stores.pointsLedger.length).toBeGreaterThan(0)
    await page.waitForFunction(() => !!navigator.serviceWorker.controller)
    const oldController = await page.evaluate(
      () => navigator.serviceWorker.controller!.scriptURL,
    )
    // An independent native registration with known active + unknown waiting
    // script must be retained as a whole; no fake worker responder is involved.
    unknownContext = await browser.newContext()
    const unknownAudit = await protect(
      unknownContext,
      origin,
      'unknown-registration-',
    )
    const unknownPage = await unknownContext.newPage()
    await unknownPage.goto(`${origin}/recovery`)
    await unknownPage.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js?v=3.0.0', { scope: '/' })
      await navigator.serviceWorker.ready
    })
    await unknownPage.waitForFunction(
      () => !!navigator.serviceWorker.controller,
    )
    await unknownPage.evaluate(async () => {
      const registration = await navigator.serviceWorker.register(
        '/sw.js?v=unknown-task7',
        { scope: '/' },
      )
      await new Promise<void>((resolve, reject) => {
        const deadline = performance.now() + 15000
        function check() {
          if (registration.waiting) {
            resolve()
            return
          }
          if (performance.now() > deadline) {
            reject(new Error('Expected real unknown waiting script'))
            return
          }
          setTimeout(check, 50)
        }
        check()
      })
    })
    await stop()
    // Actual origin unavailable without Playwright's navigator.offline emulation.
    await page.goto('/install')
    await expect(
      page.getByRole('heading', { name: '安装到手机', exact: true }),
    ).toBeVisible()
    await writeFile(
      info.outputPath('server-down-shell.json'),
      JSON.stringify({
        oldController,
        url: page.url(),
        navigatorOnline: await page.evaluate(() => navigator.onLine),
      }),
    )
    await start(true)
    await unknownPage.goto(`${origin}/recovery`)
    const registrations = () =>
      unknownPage.evaluate(async () =>
        (await navigator.serviceWorker.getRegistrations()).map(
          (registration) => ({
            scope: registration.scope,
            active: registration.active?.scriptURL,
            waiting: registration.waiting?.scriptURL,
          }),
        ),
      )
    const unknownBefore = await registrations()
    expect(unknownBefore).toEqual([
      {
        scope: `${origin}/`,
        active: `${origin}/sw.js?v=3.0.0`,
        waiting: `${origin}/sw.js?v=unknown-task7`,
      },
    ])
    await unknownPage
      .getByRole('button', { name: '注销本应用工作线程' })
      .click()
    await expect(unknownPage.getByText(/保留 1 个未知注册/)).toBeVisible()
    expect(await registrations()).toEqual(unknownBefore)
    expect(await unknownPage.evaluate(() => indexedDB.databases())).toEqual([])
    await writeFile(
      info.outputPath('unknown-native-registration.json'),
      JSON.stringify(unknownBefore, null, 2),
    )
    await unknownAudit(info)
    await unknownContext.close()
    unknownContext = undefined
    await page.goto('/recovery')
    await expect(page.getByText('SpeakMate 3.0 · 应急只读构建')).toBeVisible()
    expect(
      await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL),
    ).toBe(oldController)
    await expect(page.getByText(/当前页面仍受工作线程控制/)).toBeVisible()
    expect(await snapshot(page)).toEqual(before)
    await page.getByRole('button', { name: '注销本应用工作线程' }).click()
    await expect(page.getByText(/本应用注销请求成功/)).toBeVisible()
    await expect(page.getByText(/当前页面仍受工作线程控制/)).toBeVisible()
    await page.close()
    const recovered = await context.newPage()
    await recovered.goto(`${origin}/recovery`)
    await expect(
      recovered.getByText(/当前页面没有工作线程控制器/),
    ).toBeVisible()
    expect(
      await recovered.evaluate(() => navigator.serviceWorker.controller),
    ).toBeNull()
    expect(
      await recovered.evaluate(() =>
        navigator.serviceWorker
          .getRegistrations()
          .then((items) => items.length),
      ),
    ).toBe(0)
    const download = recovered.waitForEvent('download')
    await recovered.getByRole('button', { name: '读取并导出完整备份' }).click()
    await (await download).saveAs(info.outputPath('recovery-complete.json'))
    const normal = JSON.parse(
      await readFile(info.outputPath('normal-before-recovery.json'), 'utf8'),
    )
    const recovery = JSON.parse(
      await readFile(info.outputPath('recovery-complete.json'), 'utf8'),
    )
    expect({ ...recovery, exportedAt: normal.exportedAt }).toEqual(normal)
    expect(await snapshot(recovered)).toEqual(before)
    await writeFile(
      info.outputPath('same-origin-all12.json'),
      JSON.stringify(before, null, 2),
    )
    await recovered.addInitScript(() => {
      const audit = {
        openings: [] as { name: string; version?: number }[],
        modes: [] as string[],
        writerSurface: false,
      }
      Object.assign(window, { __recoveryAudit: audit })
      const open = IDBFactory.prototype.open
      IDBFactory.prototype.open = function (name, version) {
        audit.openings.push({ name, version })
        return open.call(this, name, version)
      }
      const transact = IDBDatabase.prototype.transaction
      IDBDatabase.prototype.transaction = function (names, mode, options) {
        audit.modes.push(mode ?? 'readonly')
        return transact.call(this, names, mode, options)
      }
      new MutationObserver(() => {
        if (
          document.querySelector(
            'textarea,input,[data-practice-dock],nav[aria-label="主要导航"]',
          )
        )
          audit.writerSurface = true
      }).observe(document, { childList: true, subtree: true })
    })
    const routes = [
      '/',
      '/install',
      '/scenes',
      '/practice',
      '/me',
      '/privacy',
      '/session',
      '/session/report',
      '/scenes/prepare',
      '/notebook',
      '/notebook/note',
      '/notebook/simulation',
      '/rewards',
      '/guide',
      '/welcome',
      '/auth',
      '/recovery',
      '/practice/today?date=2026-09-10',
      '/offline/session',
      '/session?id=new&scene=coffee-order&level=C1&mode=short',
      `/session?id=${golden.sessions[0].id}`,
      `/session/${golden.sessions[0].id}`,
      `/session/${golden.sessions[0].id}/report`,
      '/scenes/coffee-order?level=C1',
      '/notebook/note?id=unknown',
      '/notebook/simulation?id=new&source=unknown',
      '/session?id=&scene=&level=&mode=',
      '/missing-task7-page',
    ]
    const entryAudit: unknown[] = []
    for (const route of routes) {
      await recovered.goto(`${origin}${route}`)
      await expect(
        recovered.getByRole('heading', { name: '只读数据恢复' }),
      ).toBeVisible()
      await recovered
        .getByRole('button', { name: '注销本应用工作线程' })
        .click()
      await expect(
        recovered.getByText(/未发现可注销的本应用注册/),
      ).toBeVisible()
      const audit = await recovered.evaluate(
        () =>
          (window as unknown as { __recoveryAudit: unknown }).__recoveryAudit,
      )
      expect(audit).toEqual({ openings: [], modes: [], writerSurface: false })
      expect(await snapshot(recovered)).toEqual(before)
      entryAudit.push({ route, finalUrl: recovered.url(), audit })
    }
    await writeFile(
      info.outputPath('deep-entry-first-frame-audit.json'),
      JSON.stringify(entryAudit, null, 2),
    )
    for (const kind of [null, 1, 3, 'incomplete', 'corrupt'] as const) {
      const isolated = await browser.newContext()
      try {
        const isolatedAudit = await protect(
          isolated,
          origin,
          `rejected-${kind}-`,
        )
        const failurePage = await isolated.newPage()
        await failurePage.goto(`${origin}/recovery`)
        if (kind !== null)
          await failurePage.evaluate(
            async ({ kind, stores }) => {
              await new Promise<void>((resolve, reject) => {
                const request = indexedDB.open(
                  'speakmate-v1',
                  typeof kind === 'number' ? kind : 2,
                )
                request.onupgradeneeded = () => {
                  for (const name of kind === 'corrupt'
                    ? stores
                    : ['untouched']) {
                    const store = request.result.createObjectStore(name, {
                      keyPath: 'id',
                    })
                    if (name === 'profile' || name === 'untouched')
                      store.put({ id: 'synthetic-preserve', text: 'unchanged' })
                  }
                }
                request.onsuccess = () => {
                  request.result.close()
                  resolve()
                }
                request.onerror = () => reject(request.error)
              })
            },
            { kind, stores },
          )
        const prior = kind === null ? null : await snapshot(failurePage)
        await failurePage
          .getByRole('button', { name: '读取并导出完整备份' })
          .click()
        await expect(
          failurePage
            .getByRole('alert')
            .filter({ hasText: '完整导出没有完成' }),
        ).toBeVisible()
        if (kind === null)
          expect(
            await failurePage.evaluate(() => indexedDB.databases()),
          ).toEqual([])
        else expect(await snapshot(failurePage)).toEqual(prior)
        await isolatedAudit(info)
      } finally {
        await isolated.close()
      }
    }
    await recovered.close()
    await auditNetwork(info)
  } finally {
    await unknownContext?.close()
    await stop()
    await writeFile(info.outputPath('owned-servers.log'), output.join(''))
  }
})
