import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { createServer, request as httpRequest, type Server } from 'node:http'
import { registerOwnedLocalServer } from './task7-owned-local-server'
import { localState, protect } from './task7-browser-helpers'

// Only /sw.js is fault-injected. HTML, RSC, assets, public packs and business
// state use the real frozen build. No service-worker message responder is mocked.
const localServer = registerOwnedLocalServer()
const origin = 'http://127.0.0.1:3135'
const legacy = execFileSync('git', ['show', 'aacbffd:public/sw.js'])
const legacySha256 = createHash('sha256').update(legacy).digest('hex')
let proxy: Server
let mode: 'hold' | 'normal' | 'denied' | 'legacy' = 'hold'
let releases: (() => void)[] = []
let transport: {
  method: string
  path: string
  fault?: string
  status?: number
}[] = []

test.use({ baseURL: origin })
test.beforeAll(async () => {
  proxy = createServer(async (request, response) => {
    const path = request.url ?? '/'
    const row: (typeof transport)[number] = {
      method: request.method ?? 'GET',
      path,
    }
    transport.push(row)
    if (new URL(path, origin).pathname === '/sw.js') {
      if (mode === 'hold') {
        row.fault = 'HTTP response held until explicit test release'
        await new Promise<void>((resolve) => releases.push(resolve))
      }
      if (mode === 'denied') {
        row.fault = '503 only for native service-worker script request'
        row.status = 503
        response.writeHead(503, {
          'Content-Type': 'text/javascript',
          'Cache-Control': 'no-store',
        })
        response.end('// QA: native registration must reject this HTTP status.')
        return
      }
      if (mode === 'legacy') {
        row.fault = `Exact aacbffd:public/sw.js bytes, SHA256 ${legacySha256}`
        row.status = 200
        response.writeHead(200, {
          'Content-Type': 'text/javascript',
          'Cache-Control': 'no-store',
        })
        response.end(legacy)
        return
      }
    }
    const upstream = httpRequest(
      new URL(path, localServer.origin),
      {
        method: request.method,
        headers: { ...request.headers, host: new URL(localServer.origin).host },
      },
      (result) => {
        row.status = result.statusCode
        response.writeHead(result.statusCode ?? 502, result.headers)
        result.pipe(response)
      },
    )
    upstream.on('error', () => {
      response.writeHead(502)
      response.end('QA upstream unavailable')
    })
    request.pipe(upstream)
  })
  await new Promise<void>((resolve, reject) => {
    proxy.once('error', reject)
    proxy.listen(3135, '127.0.0.1', resolve)
  })
})
test.beforeEach(() => {
  mode = 'hold'
  transport = []
  releases = []
})
test.afterEach(async ({ page }, info) => {
  releaseRegistration()
  await writeFile(
    info.outputPath('transport.json'),
    JSON.stringify(
      {
        build: localServer.buildId(),
        legacySha256,
        transport,
      },
      null,
      2,
    ),
  )
  if (!page.isClosed())
    await writeFile(
      info.outputPath('worker-state.json'),
      JSON.stringify(await workerState(page), null, 2),
    )
})
test.afterAll(async () => {
  releaseRegistration()
  proxy.closeAllConnections()
  await new Promise<void>((resolve) => proxy.close(() => resolve()))
})

function releaseRegistration() {
  mode = 'normal'
  for (const resolve of releases.splice(0)) resolve()
}
async function workerState(page: Page) {
  return page.evaluate(async () => ({
    supported: 'serviceWorker' in navigator,
    controller:
      'serviceWorker' in navigator
        ? (navigator.serviceWorker.controller?.scriptURL ?? null)
        : null,
    registrations:
      'serviceWorker' in navigator
        ? (await navigator.serviceWorker.getRegistrations()).map((r) => ({
            scope: r.scope,
            active: r.active?.scriptURL,
            waiting: r.waiting?.scriptURL,
            installing: r.installing?.scriptURL,
          }))
        : [],
    caches: await caches.keys(),
    alerts: Array.from(document.querySelectorAll('[role="alert"]')).map(
      (element) => element.textContent,
    ),
  }))
}
async function onboardWithoutWaitingForControl(page: Page) {
  await page.goto('/welcome')
  await page.getByRole('button', { name: /A2/ }).click()
  await page.getByRole('button', { name: '旅行', exact: true }).click()
  await page.getByRole('button', { name: '每天 5 分钟' }).click()
  await page
    .getByRole('button', { name: '开始第一次练习', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
}
async function failedPreparation(
  page: Page,
  info: TestInfo,
  prefix: string,
  immediate = false,
) {
  const before = await localState(page)
  const beforeWorker = await workerState(page)
  const started = Date.now()
  await page.getByRole('button', { name: '准备表达热身' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: '所选任务保持原样' }),
  ).toBeVisible({ timeout: 18000 })
  const elapsedMs = Date.now() - started
  if (!immediate) expect(elapsedMs).toBeGreaterThanOrEqual(9500)
  expect(elapsedMs).toBeLessThan(18000)
  await expect(page.getByRole('button', { name: '准备表达热身' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '重新读取' })).toBeVisible()
  await expect(page.getByRole('region', { name: '表达热身流程' })).toHaveCount(
    0,
  )
  const after = await localState(page)
  expect(after).toEqual(before)
  expect(after.pointsLedger).toEqual([])
  await page.screenshot({
    path: info.outputPath(`${prefix}.png`),
    fullPage: true,
  })
  await writeFile(
    info.outputPath(`${prefix}.json`),
    JSON.stringify({ beforeWorker, elapsedMs, before, after }, null, 2),
  )
  return before
}
async function finishRecoveredWarmup(page: Page, info: TestInfo) {
  await page.getByRole('button', { name: '隐藏参考，开始回忆' }).click()
  await page
    .getByRole('textbox', { name: '我的回忆', exact: true })
    .fill('I would like my coffee black, please.')
  await page.getByRole('button', { name: '确认完成热身' }).click()
  await expect(page.getByText('热身已完成，已保存这次回忆。')).toBeVisible()
  const state = await localState(page)
  expect(state.pointsLedger).toHaveLength(1)
  expect(state.pointsLedger[0].delta).toBe(10)
  await writeFile(
    info.outputPath('recovered.json'),
    JSON.stringify(state, null, 2),
  )
}

test('cold: initially uncontrolled actual registration resolves pending preparation', async ({
  page,
  context,
}, info) => {
  test.setTimeout(60000)
  const audit = await protect(context, origin)
  await onboardWithoutWaitingForControl(page)
  expect((await workerState(page)).controller).toBeNull()
  await expect
    .poll(() =>
      transport.some((row) => row.path.startsWith('/sw.js') && !!row.fault),
    )
    .toBe(true)
  const before = await localState(page)
  await page.getByRole('button', { name: '准备表达热身' }).click()
  await expect(
    page.getByRole('button', { name: '准备表达热身' }),
  ).toBeDisabled()
  releaseRegistration()
  await expect(
    page.getByRole('button', { name: '隐藏参考，开始回忆' }),
  ).toBeVisible({ timeout: 15000 })
  expect((await workerState(page)).controller).toBe(`${origin}/sw.js?v=3.0.0`)
  expect(await localState(page)).toEqual(before)
  await finishRecoveredWarmup(page, info)
  await audit(info)
})

test('cold: ten-second controller deadline preserves all stores; manual retry succeeds', async ({
  page,
  context,
}, info) => {
  test.setTimeout(65000)
  const audit = await protect(context, origin)
  await onboardWithoutWaitingForControl(page)
  expect((await workerState(page)).controller).toBeNull()
  const before = await failedPreparation(page, info, 'controller-deadline')
  releaseRegistration()
  await page.waitForFunction(
    () => !!navigator.serviceWorker.controller,
    undefined,
    { timeout: 30000 },
  )
  expect(await localState(page)).toEqual(before)
  await page.getByRole('button', { name: '准备表达热身' }).click()
  await expect(
    page.getByRole('button', { name: '隐藏参考，开始回忆' }),
  ).toBeVisible()
  await finishRecoveredWarmup(page, info)
  await audit(info)
})

test('cold: native registration HTTP rejection is recoverable without clearing data', async ({
  page,
  context,
}, info) => {
  test.setTimeout(65000)
  mode = 'denied'
  const audit = await protect(context, origin)
  await onboardWithoutWaitingForControl(page)
  await expect
    .poll(() =>
      transport.some(
        (row) => row.path.startsWith('/sw.js') && row.status === 503,
      ),
    )
    .toBe(true)
  expect((await workerState(page)).controller).toBeNull()
  const before = await failedPreparation(
    page,
    info,
    'native-registration-rejected',
  )
  releaseRegistration()
  await page.reload()
  await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
  await page.waitForFunction(
    () => !!navigator.serviceWorker.controller,
    undefined,
    { timeout: 30000 },
  )
  expect(await localState(page)).toEqual(before)
  await page.getByRole('button', { name: '准备表达热身' }).click()
  await expect(
    page.getByRole('button', { name: '隐藏参考，开始回忆' }),
  ).toBeVisible()
  await finishRecoveredWarmup(page, info)
  await audit(info)
})

test('cold: explicit unsupported-feature simulation gives bounded error and no learning writes', async ({
  page,
  context,
}, info) => {
  test.setTimeout(30000)
  mode = 'normal'
  const audit = await protect(context, origin)
  // Browser-feature simulation only, not a claim about a physical device/OS.
  await context.addInitScript(() => {
    let owner = navigator as object | null
    while (
      owner &&
      !Object.prototype.hasOwnProperty.call(owner, 'serviceWorker')
    )
      owner = Object.getPrototypeOf(owner)
    if (owner) Reflect.deleteProperty(owner, 'serviceWorker')
  })
  await onboardWithoutWaitingForControl(page)
  expect((await workerState(page)).supported).toBe(false)
  await failedPreparation(page, info, 'unsupported-feature', true)
  expect(transport.filter((row) => row.path.startsWith('/sw.js'))).toEqual([])
  await audit(info)
})

test('cold: exact original 2.3 worker cannot supply a 3.0 proof; timeout never starts task', async ({
  page,
  context,
}, info) => {
  test.setTimeout(65000)
  mode = 'legacy'
  const audit = await protect(context, origin)
  // JSON document executes no app registration. Install the actual legacy script
  // first; later 3.0 app registration also receives legacy bytes in this test.
  await page.goto('/manifest.webmanifest')
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js?v=2.3.0', {
      updateViaCache: 'none',
    })
    await navigator.serviceWorker.ready
  })
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await onboardWithoutWaitingForControl(page)
  expect((await workerState(page)).controller).toBe(`${origin}/sw.js?v=2.3.0`)
  expect((await workerState(page)).caches).toContain(
    'speakmate-v2.3.0-shell-r1',
  )
  await failedPreparation(page, info, 'legacy-no-proof')
  expect(transport.some((row) => row.fault?.includes(legacySha256))).toBe(true)
  await audit(info)
})
