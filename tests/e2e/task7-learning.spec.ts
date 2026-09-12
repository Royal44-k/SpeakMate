import { expect, test, type Page } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { spawn, type ChildProcess } from 'node:child_process'
import { SCENE_METADATA } from '../../src/content/scenes/metadata'
import type { DataState } from '../../src/infrastructure/persistence/storage'

// Distinct fault injection: hosting really unavailable, browser onLine unchanged.
// Never substitutes for the separately retained WebKit setOffline failure.
const serverDown = process.env.TASK7_SERVER_DOWN === '1'
const isolatedOrigin = 'http://127.0.0.1:3131'
if (serverDown) test.use({ baseURL: isolatedOrigin })
let ownedServer: ChildProcess | undefined
const serverOutput: string[] = []
async function stopOwnedServer() {
  const server = ownedServer
  ownedServer = undefined
  if (server)
    await new Promise<void>((resolve) => {
      server.once('exit', () => resolve())
      server.kill('SIGTERM')
    })
}
test.beforeEach(async () => {
  if (!serverDown) return
  try {
    await fetch(`${isolatedOrigin}/api/v1/health`)
    throw new Error('Refuse occupied isolated port')
  } catch (error) {
    if (!(error instanceof TypeError)) throw error
  }
  ownedServer = spawn(
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
      env: { ...process.env, NEXT_PUBLIC_RECOVERY_ONLY: '' },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  ownedServer.stdout?.on('data', (data) => serverOutput.push(String(data)))
  ownedServer.stderr?.on('data', (data) => serverOutput.push(String(data)))
  await expect
    .poll(
      async () => {
        try {
          return (await (await fetch(`${isolatedOrigin}/api/v1/health`)).json())
            .mode
        } catch {
          return 'not-ready'
        }
      },
      { timeout: 30000 },
    )
    .toBe('local-learning')
})
test.afterEach(async ({}, info) => {
  if (!serverDown) return
  await stopOwnedServer()
  await writeFile(info.outputPath('owned-server.log'), serverOutput.join(''))
})

async function localState(page: Page): Promise<DataState> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('speakmate-v1')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      request.onupgradeneeded = () => {
        request.transaction?.abort()
        reject(new Error('Expected existing synthetic database'))
      }
    })
    try {
      const names = Array.from(database.objectStoreNames)
      const tx = database.transaction(names, 'readonly')
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
      return Object.fromEntries(rows) as DataState
    } finally {
      database.close()
    }
  })
}

async function onboard(page: Page) {
  await page.goto('/welcome')
  await page.getByRole('button', { name: /A2/ }).click()
  await page.getByRole('button', { name: '旅行', exact: true }).click()
  await page.getByRole('button', { name: '每天 5 分钟' }).click()
  await page
    .getByRole('button', { name: '开始第一次练习', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
}

function balance(state: DataState) {
  return state.pointsLedger.reduce((total, entry) => total + entry.delta, 0)
}

async function actualAnswer(page: Page) {
  await page.getByText('本题参考表达', { exact: true }).click()
  await page.getByRole('button', { name: '使用参考 1 并确认' }).click()
  await expect(page.getByRole('textbox', { name: '英文内容' })).not.toHaveValue(
    '',
  )
  await page.getByRole('button', { name: '提交这一轮' }).click()
}

for (const disconnected of [false, true]) {
  test(`A/G ${disconnected ? 'offline' : 'online'}: real zero-point onboarding → warmup → terminal refresh → capture choice → simulation → 35-point backup`, async ({
    page,
    context,
    baseURL,
  }, info) => {
    test.setTimeout(180_000)
    await page.clock.setFixedTime(new Date('2026-09-10T02:00:00Z'))
    const requests: { method: string; url: string; body: string | null }[] = []
    context.on('request', (request) =>
      requests.push({
        method: request.method(),
        url: request.url(),
        body: request.postData(),
      }),
    )
    await context.route('**/*', (route) =>
      new URL(route.request().url()).origin === baseURL
        ? route.continue()
        : route.abort(),
    )
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await onboard(page)
    const originalPlan = (await localState(page)).dailyPlans
    if (disconnected) {
      const target = originalPlan[0].tasks.find(
        (task) => task.slot === 'scene',
      )!.target
      if (target.kind !== 'scene') throw new Error('Expected planner scene')
      const slug = SCENE_METADATA.find(
        (scene) => scene.id === target.sceneId,
      )!.slug
      for (const scene of [slug, 'coffee-order']) {
        await page.goto(`/scenes/prepare?scene=${scene}&level=A2&mode=short`)
        await expect(
          page.getByText(/本版页面与共享资源已验证缓存/),
        ).toBeVisible()
        await expect(page.getByText(/此分类已验证缓存/)).toBeVisible()
      }
      const readiness = await page.evaluate(
        () =>
          new Promise<unknown>((resolve, reject) => {
            const timer = setTimeout(
              () => reject(new Error('No actual SW readiness reply')),
              10000,
            )
            const listener = (event: MessageEvent) => {
              if (event.data?.type !== 'OFFLINE_STATUS') return
              clearTimeout(timer)
              navigator.serviceWorker.removeEventListener('message', listener)
              resolve(event.data)
            }
            navigator.serviceWorker.addEventListener('message', listener)
            navigator.serviceWorker.controller!.postMessage({
              type: 'OFFLINE_STATUS',
            })
          }),
      )
      expect(readiness).toMatchObject({
        shellReady: true,
        categories: {
          travel: true,
          dining: true,
          daily: false,
          work: false,
          social: false,
          study: false,
          emergency: false,
        },
      })
      await writeFile(
        info.outputPath('prepared-readiness.json'),
        JSON.stringify(readiness, null, 2),
      )
      await page.goto('/')
      expect((await localState(page)).sessions).toEqual([])
      expect((await localState(page)).notebook).toEqual([])
      if (serverDown) {
        await stopOwnedServer()
        let hostingUnreachable = false
        try {
          await fetch(`${isolatedOrigin}/api/v1/health`)
        } catch (error) {
          hostingUnreachable = error instanceof TypeError
        }
        expect(hostingUnreachable).toBe(true)
        const navigatorOnline = await page.evaluate(() => navigator.onLine)
        expect(navigatorOnline).toBe(true)
        await writeFile(
          info.outputPath('server-unreachable.json'),
          JSON.stringify({
            hostingUnreachable,
            navigatorOnline,
            origin: isolatedOrigin,
          }),
        )
      } else await context.setOffline(true)
    }
    expect(balance(await localState(page))).toBe(0)
    await page.reload()
    await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
    expect((await localState(page)).dailyPlans).toEqual(originalPlan)
    const other = await context.newPage()
    await other.goto('/')
    await expect(other.getByRole('heading', { name: '今日目标' })).toBeVisible()
    expect((await localState(other)).dailyPlans).toEqual(originalPlan)
    await other.close()

    await page.getByRole('button', { name: '准备表达热身' }).click()
    const flow = page.getByRole('region', { name: '表达热身流程' })
    await expect(flow).toBeVisible()
    // No locator action is allowed to scroll the newly inserted flow before this check.
    const entered = await flow.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return {
        top: rect.top,
        bottom: rect.bottom,
        viewport: innerHeight,
        focused: element.contains(document.activeElement),
      }
    })
    expect(entered.top).toBeGreaterThan(-80)
    expect(entered.top).toBeLessThan(entered.viewport - 100)
    expect(entered.focused).toBe(true)
    await page.screenshot({
      path: info.outputPath('warmup-entered.png'),
      fullPage: false,
    })
    await page.getByRole('button', { name: '隐藏参考，开始回忆' }).click()
    const recall = page.getByRole('textbox', { name: '我的回忆', exact: true })
    await expect(recall).toBeVisible()
    await recall.fill('I remember black coffee.')
    await page.getByRole('button', { name: '确认完成热身' }).click()
    await expect(page.getByText('热身已完成，已保存这次回忆。')).toBeVisible()
    await expect.poll(async () => balance(await localState(page))).toBe(10)

    await page.getByRole('button', { name: '开始场景应用' }).click()
    await expect(
      page.getByRole('heading', { name: 'Dialogue Stage' }),
    ).toBeVisible()
    expect(new URL(page.url()).searchParams.get('id')).not.toBe('new')
    const sceneId = new URL(page.url()).searchParams.get('id')!
    await actualAnswer(page)
    const goal = originalPlan[0].tasks.find((task) => task.slot === 'scene')!
    if (goal.target.kind !== 'scene')
      throw new Error('Expected actual scene target')
    for (let turn = 1; turn < goal.target.requiredUserTurns; turn += 1) {
      await page.getByRole('button', { name: '我需要表达提示' }).click()
      await expect
        .poll(
          async () =>
            (await localState(page)).turns.filter(
              (value) => value.sessionId === sceneId,
            ).length,
        )
        .toBe(turn + 1)
    }
    await expect(
      page.getByRole('button', { name: '确认结束并保存复盘' }),
    ).toBeVisible()
    expect(balance(await localState(page))).toBe(10)
    await page.reload()
    await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
    await expect(
      page.getByRole('heading', { name: '这轮已保存。' }),
    ).toBeVisible()
    expect(balance(await localState(page))).toBe(20)
    await page.getByRole('link', { name: '查看本次复盘' }).click()
    await page.getByRole('link', { name: '返回 2026-09-10 的原任务' }).click()

    await page.getByRole('button', { name: '选择巩固材料' }).click()
    await page.getByRole('button', { name: '查看校审备用词句' }).click()
    await expect(page.getByText('black', { exact: true })).toBeVisible()
    expect((await localState(page)).notebook).toEqual([])
    await page
      .getByRole('button', { name: '记录这条校审词句并用于任务' })
      .click()
    await page.getByRole('button', { name: '开始这次定向练习' }).click()
    await page.getByRole('textbox', { name: '我回忆的表达' }).fill('black')
    await page.getByRole('button', { name: '保存回忆并查看' }).click()
    await expect(
      page.getByRole('textbox', { name: '我的替换或造句' }),
    ).toBeVisible()
    await page.reload()
    await page
      .getByRole('textbox', { name: '我的替换或造句' })
      .fill('I would like black coffee, please.')
    await page.getByRole('button', { name: '保存造句并应用' }).click()
    await expect(page.getByRole('region', { name: '当前问题' })).toBeVisible()
    const simulationId = new URL(page.url()).searchParams.get('id')!
    const simulation = (await localState(page)).sessions.find(
      (session) => session.id === simulationId,
    )!
    expect(simulation.simulation?.recall?.text).toBe('black')
    expect(simulation.simulation?.composition?.text).toBe(
      'I would like black coffee, please.',
    )
    const simulationTask = (await localState(page)).dailyPlans[0].tasks.find(
      (task) => task.slot === 'consolidation',
    )!
    if (simulationTask.target.kind !== 'simulation')
      throw new Error('Expected atomically bound simulation target')
    for (
      let turn = 0;
      turn < simulationTask.target.requiredUserTurns;
      turn += 1
    ) {
      await actualAnswer(page)
      await expect
        .poll(
          async () =>
            (await localState(page)).turns.filter(
              (value) => value.sessionId === simulationId,
            ).length,
        )
        .toBe(turn + 1)
    }
    await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
    await expect(
      page.getByRole('heading', { name: '这轮已保存。' }),
    ).toBeVisible()
    await expect.poll(async () => balance(await localState(page))).toBe(35)
    await page.reload()
    expect(balance(await localState(page))).toBe(35)
    await page.getByRole('link', { name: '查看本次复盘' }).click()
    await page.reload()
    expect(balance(await localState(page))).toBe(35)
    await page.goto('/privacy')
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: '导出学习数据' }).click()
    const download = await downloadPromise
    const path = info.outputPath('synthetic-completed-backup.json')
    await download.saveAs(path)
    const exported = JSON.parse(await readFile(path, 'utf8'))
    const state = await localState(page)
    expect(exported.schemaVersion).toBe(2)
    expect(exported.sessions).toEqual(state.sessions)
    expect(exported.notebook).toEqual(state.notebook)
    expect(exported.learningEvents).toEqual(state.learningEvents)
    expect(exported.pointsLedger).toEqual(state.pointsLedger)
    expect(errors).toEqual([])
    expect(
      requests.filter((request) => !['GET', 'HEAD'].includes(request.method)),
    ).toEqual([])
    expect(
      requests.filter((request) => new URL(request.url).origin !== baseURL),
    ).toEqual([])
    await info.attach('network', {
      body: JSON.stringify(requests, null, 2),
      contentType: 'application/json',
    })
    await info.attach('final-local-state', {
      body: JSON.stringify(state, null, 2),
      contentType: 'application/json',
    })
    await writeFile(
      info.outputPath('network.json'),
      JSON.stringify(requests, null, 2),
    )
    await writeFile(
      info.outputPath('final-local-state.json'),
      JSON.stringify(state, null, 2),
    )
  })
}
