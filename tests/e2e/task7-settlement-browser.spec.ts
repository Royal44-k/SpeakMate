import {
  expect,
  test,
  type Page,
  type BrowserContext,
  type TestInfo,
} from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { spawn, type ChildProcess } from 'node:child_process'
import type { DataState } from '../../src/infrastructure/persistence/storage'

// B/C/E acceptance only. All contexts are synthetic. No application test hooks,
// real profiles, direct ledger seeding, changed reward prices or remote services.
const anchor = '2026-09-10T02:00:00Z'
const finishLabel = '确认结束并保存复盘'
const origin = 'http://127.0.0.1:3132'
test.use({ baseURL: origin })
let server: ChildProcess | undefined
const serverOutput: string[] = []
test.beforeAll(async () => {
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
  server.stdout?.on('data', (data) => serverOutput.push(String(data)))
  server.stderr?.on('data', (data) => serverOutput.push(String(data)))
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
  await writeFile(info.outputPath('owned-server.log'), serverOutput.join(''))
})

test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus || page.isClosed()) return
  const diagnostic = await page.evaluate(async () => ({
    href: location.href,
    alerts: Array.from(document.querySelectorAll('[role="alert"]')).map(
      (element) => element.textContent,
    ),
    controller: navigator.serviceWorker.controller?.scriptURL ?? null,
    registrations: (await navigator.serviceWorker.getRegistrations()).map(
      (registration) => ({
        scope: registration.scope,
        active: registration.active?.state,
        waiting: registration.waiting?.state,
        installing: registration.installing?.state,
      }),
    ),
    cacheNames: await caches.keys(),
  }))
  await writeFile(
    info.outputPath('failure-browser-state.json'),
    JSON.stringify(diagnostic, null, 2),
  )
})

async function state(page: Page): Promise<DataState> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('speakmate-v1')
      request.onupgradeneeded = () => {
        request.transaction?.abort()
        reject(new Error('Expected existing synthetic DB'))
      }
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
    try {
      const names = Array.from(db.objectStoreNames)
      const tx = db.transaction(names, 'readonly')
      return Object.fromEntries(
        await Promise.all(
          names.map(
            (name) =>
              new Promise<[string, unknown[]]>((resolve, reject) => {
                const request = tx.objectStore(name).getAll()
                request.onsuccess = () => resolve([name, request.result])
                request.onerror = () => reject(request.error)
              }),
          ),
        ),
      ) as DataState
    } finally {
      db.close()
    }
  })
}
const points = (data: DataState) =>
  data.pointsLedger.reduce((sum, row) => sum + row.delta, 0)
const earned = (data: DataState) =>
  data.pointsLedger.reduce((sum, row) => sum + Math.max(0, row.delta), 0)

async function protect(context: BrowserContext, origin: string) {
  context.setDefaultTimeout(15000)
  const network: { method: string; url: string }[] = []
  const errors: string[] = []
  context.on('request', (request) =>
    network.push({ method: request.method(), url: request.url() }),
  )
  context.on('page', (page) =>
    page.on('pageerror', (error) => errors.push(error.message)),
  )
  for (const page of context.pages())
    page.on('pageerror', (error) => errors.push(error.message))
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort(),
  )
  return async (info: TestInfo, label: string) => {
    await writeFile(
      info.outputPath(`${label}-network.json`),
      JSON.stringify({ network, errors }, null, 2),
    )
    expect(
      network.filter(
        (row) =>
          !['GET', 'HEAD'].includes(row.method) ||
          new URL(row.url).origin !== origin,
      ),
    ).toEqual([])
    expect(errors).toEqual([])
  }
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
async function warmup(page: Page) {
  await page.getByRole('button', { name: '准备表达热身' }).click()
  await page.getByRole('button', { name: '隐藏参考，开始回忆' }).click()
  await page
    .getByRole('textbox', { name: '我的回忆', exact: true })
    .fill('I remember a useful expression.')
  await page.getByRole('button', { name: '确认完成热身' }).click()
  await expect(page.getByText('热身已完成，已保存这次回忆。')).toBeVisible()
}
async function answer(page: Page) {
  await page.getByText('本题参考表达', { exact: true }).click()
  await page.getByRole('button', { name: '使用参考 1 并确认' }).click()
  await expect(page.getByRole('textbox', { name: '英文内容' })).not.toHaveValue(
    '',
  )
  await page.getByRole('button', { name: '提交这一轮' }).click()
  await expect(page.getByRole('textbox', { name: '英文内容' })).toBeHidden()
}
async function reachTerminal(page: Page) {
  await expect(
    page.getByRole('heading', { name: 'Dialogue Stage' }),
  ).toBeVisible()
  const id = new URL(page.url()).searchParams.get('id')!
  expect(id).not.toBe('new')
  await answer(page)
  const data = await state(page)
  const session = data.sessions.find((row) => row.id === id)!
  const provenance = session.provenance!
  const target = data.dailyPlans
    .find((plan) => plan.id === provenance.planId)!
    .tasks.find((task) => task.id === provenance.sourceTaskId)!.target
  if (target.kind !== 'scene' && target.kind !== 'simulation')
    throw new Error('Expected actual bound target')
  for (let turn = 1; turn < target.requiredUserTurns; turn++) {
    await page.getByRole('button', { name: '我需要表达提示' }).click()
    await expect
      .poll(
        async () =>
          (await state(page)).turns.filter((row) => row.sessionId === id)
            .length,
      )
      .toBe(turn + 1)
  }
  await expect(page.getByRole('button', { name: finishLabel })).toBeVisible()
  return id
}
async function finish(page: Page) {
  await page.getByRole('button', { name: finishLabel }).click()
  await expect(
    page.getByRole('heading', { name: '这轮已保存。' }),
  ).toBeVisible()
}
async function download(page: Page, info: TestInfo, name: string) {
  await page.goto('/privacy')
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出学习数据' }).click()
  const path = info.outputPath(`${name}.json`)
  await (await downloading).saveAs(path)
  return { path, text: await readFile(path, 'utf8') }
}
async function restore(page: Page, text: string) {
  await page.goto('/privacy')
  await page.getByLabel('选择学习数据备份').setInputFiles({
    name: 'synthetic-earned.json',
    mimeType: 'application/json',
    buffer: Buffer.from(text),
  })
  await expect(page.getByRole('heading', { name: '恢复预览' })).toBeVisible()
  await page.getByRole('button', { name: '确认合并恢复' }).click()
  await expect(page.getByText(/恢复完成：/)).toBeVisible()
}
async function finalTaskCheckpoint(page: Page) {
  await onboard(page)
  await warmup(page)
  await page.getByRole('button', { name: '开始场景应用' }).click()
  await reachTerminal(page)
  await finish(page)
  expect(points(await state(page))).toBe(20)
  await page.goto('/')
  await page.getByRole('button', { name: '选择巩固材料' }).click()
  await page.getByRole('button', { name: '查看校审备用词句' }).click()
  await page.getByRole('button', { name: '记录这条校审词句并用于任务' }).click()
  await page.getByRole('button', { name: '开始这次定向练习' }).click()
  await page.getByRole('textbox', { name: '我回忆的表达' }).fill('black')
  await page.getByRole('button', { name: '保存回忆并查看' }).click()
  await page
    .getByRole('textbox', { name: '我的替换或造句' })
    .fill('I would like black coffee, please.')
  await page.getByRole('button', { name: '保存造句并应用' }).click()
  await reachTerminal(page)
  return page.url()
}

// Catches split settlement writes, lost retry identity and non-idempotent finishes.
test('B: abort the final bonus write, retry same finish, then simultaneous finishes settle once', async ({
  page,
  context,
  browser,
  baseURL,
}, info) => {
  test.setTimeout(180000)
  const audit = await protect(context, baseURL!)
  await page.clock.setFixedTime(new Date(anchor))
  const url = await finalTaskCheckpoint(page)
  const backup = await download(page, info, 'twenty-points-terminal')
  await page.goto(url)
  await expect(page.getByRole('button', { name: finishLabel })).toBeVisible()
  const before = await state(page)
  // Native storage failure at a named real write; no replacement business method.
  await page.evaluate(() => {
    const fault = { armed: true, aborted: false, attemptedBonusId: '' }
    Object.assign(window, { __settlementFault: fault })
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (value, key) {
      const request = original.call(this, value, key)
      if (fault.armed && this.name === 'pointsLedger' && value.delta === 5) {
        fault.armed = false
        fault.aborted = true
        fault.attemptedBonusId = value.id
        this.transaction.abort()
      }
      return request
    }
  })
  await page.getByRole('button', { name: finishLabel }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: '本机保存暂时失败' }),
  ).toBeVisible()
  const fault = await page.evaluate(
    () =>
      (
        window as unknown as {
          __settlementFault: { aborted: boolean; attemptedBonusId: string }
        }
      ).__settlementFault,
  )
  expect(fault.aborted).toBe(true)
  const failed = await state(page)
  for (const store of [
    'sessions',
    'turns',
    'dailyPlans',
    'pointsLedger',
  ] as const)
    expect(failed[store]).toEqual(before[store])
  expect(
    failed.learningEvents.filter(
      (row) => row.type !== 'foreground-time-recorded',
    ),
  ).toEqual(
    before.learningEvents.filter(
      (row) => row.type !== 'foreground-time-recorded',
    ),
  )
  expect(points(failed)).toBe(20)
  await writeFile(
    info.outputPath('aborted-transaction.json'),
    JSON.stringify({ fault, before, failed }, null, 2),
  )
  await finish(page)
  const retried = await state(page)
  expect(points(retried)).toBe(35)
  expect(
    retried.pointsLedger.filter((row) => row.id === fault.attemptedBonusId),
  ).toHaveLength(1)
  await page.reload()
  expect(points(await state(page))).toBe(35)

  const race = await browser.newContext({
    baseURL,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  try {
    const a = await race.newPage()
    await a.clock.setFixedTime(new Date(anchor))
    const raceAudit = await protect(race, baseURL!)
    await restore(a, backup.text)
    const b = await race.newPage()
    await b.clock.setFixedTime(new Date(anchor))
    await Promise.all([a.goto(url), b.goto(url)])
    await Promise.all([
      expect(a.getByRole('button', { name: finishLabel })).toBeVisible(),
      expect(b.getByRole('button', { name: finishLabel })).toBeVisible(),
    ])
    await Promise.all([
      a.getByRole('button', { name: finishLabel }).click(),
      b.getByRole('button', { name: finishLabel }).click(),
    ])
    await Promise.all([
      expect(a.getByRole('heading', { name: '这轮已保存。' })).toBeVisible(),
      expect(b.getByRole('heading', { name: '这轮已保存。' })).toBeVisible(),
    ])
    const raced = await state(a)
    expect(points(raced)).toBe(35)
    expect(raced.pointsLedger).toHaveLength(4)
    await writeFile(
      info.outputPath('same-finish-race.json'),
      JSON.stringify(raced, null, 2),
    )
    await raceAudit(info, 'same-finish')
  } finally {
    await race.close()
  }
  await audit(info, 'failure-retry')
})

// Catches a losing finish/stop operation overwriting the transaction winner.
test('B: finish and stop from two live windows preserve one terminal result', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(120000)
  const audit = await protect(context, baseURL!)
  await page.clock.setFixedTime(new Date(anchor))
  const url = await finalTaskCheckpoint(page)
  const b = await context.newPage()
  await b.clock.setFixedTime(new Date(anchor))
  await b.goto(url)
  await expect(b.getByRole('button', { name: '停止本次练习' })).toBeVisible()
  await Promise.all([
    page.getByRole('button', { name: finishLabel }).click(),
    b.getByRole('button', { name: '停止本次练习' }).click(),
  ])
  const id = new URL(url).searchParams.get('id')!
  await expect
    .poll(
      async () =>
        (await state(page)).sessions.find((row) => row.id === id)!.status,
    )
    .not.toBe('active')
  const result = await state(page)
  const winner = result.sessions.find((row) => row.id === id)!.status
  expect(['completed', 'abandoned']).toContain(winner)
  expect(points(result)).toBe(winner === 'completed' ? 35 : 20)
  const losing = winner === 'completed' ? b : page
  await expect(
    losing
      .getByRole('alert')
      .filter({ hasText: /已在别处变化|不支持这次操作/ }),
  ).toBeVisible()
  await page.reload()
  expect(
    (await state(page)).sessions.find((row) => row.id === id)!.status,
  ).toBe(winner)
  expect(points(await state(page))).toBe(points(result))
  await writeFile(
    info.outputPath('finish-stop-race.json'),
    JSON.stringify(result, null, 2),
  )
  await audit(info, 'finish-stop')
})

async function earnWarmups(page: Page, firstDay: number, days: number) {
  for (let day = firstDay; day < firstDay + days; day++) {
    await page.clock.setFixedTime(new Date(Date.UTC(2026, 6, 1 + day, 2)))
    await page.goto('/')
    await warmup(page)
  }
}

// Catches wrong award/check-in dates, midnight misallocation and background accrual.
// Visibility is a controlled browser-document signal, not an OS app-switch claim.
test('C: two old plans complete after midnight, foreground splits and new plan stays independent', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(120000)
  const audit = await protect(context, baseURL!)
  await page.clock.install({ time: new Date('2026-09-09T02:00:00Z') })
  await onboard(page)
  await page.getByRole('button', { name: '准备表达热身' }).click()
  await page.getByRole('button', { name: '隐藏参考，开始回忆' }).click()
  await expect(
    page.getByRole('textbox', { name: '我的回忆', exact: true }),
  ).toBeVisible()
  await page.goto('/privacy')
  await page.clock.pauseAt(new Date('2026-09-10T15:58:00Z'))
  await page.goto('/')
  await page.getByRole('button', { name: '开始场景应用' }).click()
  await expect(
    page.getByRole('heading', { name: 'Dialogue Stage' }),
  ).toBeVisible()
  const id = new URL(page.url()).searchParams.get('id')!
  expect(id).not.toBe('new')
  const initial = await state(page)
  const task = initial.dailyPlans
    .find((plan) => plan.dateKey === '2026-09-10')!
    .tasks.find((row) => row.slot === 'scene')!
  const originalSnapshot = initial.dailyPlans.find(
    (plan) => plan.dateKey === '2026-09-10',
  )!.snapshot
  const duration = async () =>
    (await state(page)).learningEvents.reduce(
      (sum, event) =>
        sum +
        (event.type === 'foreground-time-recorded' &&
        event.runId.startsWith(`${id}_`)
          ? event.durationMs
          : 0),
      0,
    )
  await page.clock.runFor(30000)
  await expect.poll(duration).toBe(30000)
  await page.evaluate(() => {
    const visibility = { value: 'hidden' }
    Object.assign(window, { __qaVisibility: visibility })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility.value,
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.fastForward(60000)
  expect(await duration()).toBe(30000)
  await page.evaluate(() => {
    ;(
      window as unknown as { __qaVisibility: { value: string } }
    ).__qaVisibility.value = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.fastForward(210000)
  await expect.poll(duration).toBe(240000)
  const foreground = (await state(page)).learningEvents.filter(
    (event) =>
      event.type === 'foreground-time-recorded' &&
      event.runId.startsWith(`${id}_`),
  )
  const totals: Record<string, number> = {}
  for (const event of foreground)
    if (event.type === 'foreground-time-recorded')
      totals[event.dateKey] = (totals[event.dateKey] ?? 0) + event.durationMs
  expect(totals).toEqual({ '2026-09-10': 60000, '2026-09-11': 180000 })
  expect(await page.evaluate(() => new Date().toISOString())).toBe(
    '2026-09-10T16:03:00.000Z',
  )
  await reachTerminal(page)
  await finish(page)
  const completed = await state(page)
  expect(points(completed)).toBe(10)
  const event = completed.learningEvents.find(
    (row) => row.type === 'session-completed' && row.sessionId === id,
  )!
  expect(event.dateKey).toBe('2026-09-11')
  expect(event.provenance).toMatchObject({
    planDate: '2026-09-10',
    sourceTaskId: task.id,
  })
  expect(
    completed.dailyPlans.find((plan) => plan.dateKey === '2026-09-10')!
      .snapshot,
  ).toEqual(originalSnapshot)
  await page.goto('/?date=2026-09-09&task=warmup')
  await warmup(page)
  expect(points(await state(page))).toBe(20)
  const twoOld = (await state(page)).learningEvents.filter(
    (row) =>
      row.type === 'session-completed' || row.type === 'warmup-completed',
  )
  expect(twoOld).toHaveLength(2)
  expect(twoOld.every((row) => row.dateKey === '2026-09-11')).toBe(true)
  expect(twoOld.map((row) => row.provenance?.planDate).sort()).toEqual([
    '2026-09-09',
    '2026-09-10',
  ])
  await page.goto('/')
  await expect(page.getByText(/2026-09-11 · 今日任务等级/)).toBeVisible()
  const today = (await state(page)).dailyPlans.find(
    (plan) => plan.dateKey === '2026-09-11',
  )!
  expect(today.tasks.every((row) => row.status === 'not-started')).toBe(true)
  await page.reload()
  await expect(page.getByText(/2026-09-11 · 今日任务等级/)).toBeVisible()
  expect(
    (await state(page)).dailyPlans.find((plan) => plan.id === today.id),
  ).toEqual(today)
  await page.goto('/scenes')
  await page.getByRole('button', { name: 'B2', exact: true }).click()
  await expect.poll(async () => (await state(page)).profile[0].level).toBe('B2')
  await page.goto('/')
  await expect(page.getByText(/今日任务等级 A2/)).toBeVisible()
  await expect(page.getByText(/当前个人等级 B2/)).toBeVisible()
  await page.goto('/practice')
  await expect(
    page.getByRole('combobox', { name: '当前练习水平' }),
  ).toHaveValue('B2')
  await expect(page.getByRole('link', { name: '准备开始' })).toHaveAttribute(
    'href',
    /[?&]level=B2(?:&|$)/,
  )
  const final = await state(page)
  expect(final.sessions.find((row) => row.id === id)!.level).toBe('A2')
  expect(
    final.dailyPlans.find((plan) => plan.id === today.id)!.snapshot.level,
  ).toBe('A2')
  expect(points(final)).toBe(20)
  await writeFile(
    info.outputPath('crossday-state.json'),
    JSON.stringify(
      {
        foreground,
        totals,
        final,
        visibilityMethod: 'document signal injection; no OS app switching',
      },
      null,
      2,
    ),
  )
  await audit(info, 'crossday')
})

async function chooseReward(page: Page, title: string, price: number) {
  await page
    .getByRole('article', { name: title, exact: true })
    .getByRole('button', { name: `兑换 · ${price} 积分` })
    .click()
  await expect(page.getByRole('region', { name: '确认兑换' })).toBeVisible()
}

// Catches double spending, fake successful application and blank digital rewards.
test('E: UI-earned points, same/different reward races and actual 100/200/300 applications', async ({
  page,
  context,
  browser,
  baseURL,
}, info) => {
  test.setTimeout(300000)
  const audit = await protect(context, baseURL!)
  await page.clock.setFixedTime(new Date('2026-07-01T02:00:00Z'))
  await onboard(page)
  // E measures reward settlement after installation. The separate cold-start
  // matrix retains the observed first-use failure; no worker is stubbed here.
  await page.waitForFunction(
    () => !!navigator.serviceWorker.controller,
    undefined,
    { timeout: 30000 },
  )
  await earnWarmups(page, 0, 10)
  const hundred = await state(page)
  expect(points(hundred)).toBe(100)
  expect(earned(hundred)).toBe(100)
  expect(
    hundred.learningEvents.filter((row) => row.type === 'warmup-completed'),
  ).toHaveLength(10)
  const backup = await download(page, info, 'ui-earned-hundred')

  for (const same of [true, false]) {
    const race = await browser.newContext({
      baseURL,
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })
    try {
      const a = await race.newPage()
      const raceAudit = await protect(race, baseURL!)
      await a.clock.setFixedTime(new Date('2026-07-10T02:00:00Z'))
      await restore(a, backup.text)
      const b = await race.newPage()
      await b.clock.setFixedTime(new Date('2026-07-10T02:00:00Z'))
      await Promise.all([a.goto('/rewards'), b.goto('/rewards')])
      await chooseReward(a, '深海个人卡', 100)
      await chooseReward(b, same ? '深海个人卡' : '纸页个人卡', 100)
      await Promise.all([
        a.getByRole('button', { name: '确认兑换', exact: true }).click(),
        b.getByRole('button', { name: '确认兑换', exact: true }).click(),
      ])
      await expect
        .poll(async () => (await state(a)).rewardUnlocks.length)
        .toBe(1)
      const result = await state(a)
      expect(points(result)).toBe(0)
      expect(earned(result)).toBe(100)
      expect(result.pointsLedger.filter((row) => row.delta < 0)).toHaveLength(1)
      if (same) {
        await expect
          .poll(
            async () =>
              `${await a.locator('main').innerText()} ${await b.locator('main').innerText()}`,
          )
          .toContain('没有重复扣分')
      } else {
        await expect
          .poll(
            async () =>
              `${await a.locator('main').innerText()} ${await b.locator('main').innerText()}`,
          )
          .toContain('余额不足')
      }
      await writeFile(
        info.outputPath(`reward-${same ? 'same' : 'different'}-race.json`),
        JSON.stringify(result, null, 2),
      )
      await raceAudit(info, `reward-${same ? 'same' : 'different'}`)
    } finally {
      await race.close()
    }
  }

  await page.goto('/me')
  const profileBefore = await page
    .locator('main header')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor)
  await page.goto('/rewards')
  await chooseReward(page, '深海个人卡', 100)
  await page.getByRole('button', { name: '确认兑换', exact: true }).click()
  await page
    .getByRole('article', { name: '深海个人卡' })
    .getByRole('button', { name: '应用', exact: true })
    .click()
  await expect(page.getByText('已应用，下次打开对应页面仍保留。')).toBeVisible()
  await expect(
    page.getByRole('article', { name: '深海个人卡' }).getByText('正在使用'),
  ).toBeVisible()
  await page.getByRole('link', { name: '查看我的个人卡', exact: true }).click()
  const profile = page.locator('[data-profile-style="profile-atlantic"]')
  await expect(profile).toBeVisible()
  expect(
    await profile.evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe(profileBefore)
  await page.reload()
  await expect(
    page.locator('[data-profile-style="profile-atlantic"]'),
  ).toBeVisible()
  await expect(page.getByText('示例数据，非真实好友排名')).toBeVisible()
  await page.screenshot({ path: info.outputPath('applied-profile.png') })

  await earnWarmups(page, 10, 20)
  expect(points(await state(page))).toBe(200)
  await page.goto('/')
  const coverBefore = await page
    .locator('main > header')
    .evaluate((el) => getComputedStyle(el).backgroundColor)
  await page.goto('/rewards')
  await chooseReward(page, '海平线目标封面', 200)
  await page.getByRole('button', { name: '确认兑换', exact: true }).click()
  await page
    .getByRole('article', { name: '海平线目标封面' })
    .getByRole('button', { name: '应用', exact: true })
    .click()
  await expect(page.getByText('已应用，下次打开对应页面仍保留。')).toBeVisible()
  await expect(
    page.getByRole('article', { name: '海平线目标封面' }).getByText('正在使用'),
  ).toBeVisible()
  await page
    .getByRole('link', { name: '返回今日目标', exact: true })
    .last()
    .click()
  await expect(page.locator('[data-cover="cover-horizon"]')).toBeVisible()
  expect(
    await page
      .locator('[data-cover="cover-horizon"]')
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe(coverBefore)
  await page.reload()
  await expect(page.locator('[data-cover="cover-horizon"]')).toBeVisible()
  await page.screenshot({ path: info.outputPath('applied-cover.png') })

  await earnWarmups(page, 30, 30)
  expect(points(await state(page))).toBe(300)
  await page.goto('/rewards')
  await chooseReward(page, '把话问清楚', 300)
  await page.getByRole('button', { name: '确认兑换', exact: true }).click()
  await page
    .getByRole('article', { name: '把话问清楚' })
    .getByRole('button', { name: '阅读练习资料' })
    .click()
  const sheet = page.getByRole('region', { name: '把话问清楚' })
  await expect(
    sheet.getByText('Could you say that again, please?', { exact: true }),
  ).toBeVisible()
  expect((await sheet.innerText()).length).toBeGreaterThan(400)
  const final = await state(page)
  expect(earned(final)).toBe(600)
  expect(points(final)).toBe(0)
  expect(final.rewardUnlocks).toHaveLength(3)
  await page.reload()
  await page
    .getByRole('article', { name: '把话问清楚' })
    .getByRole('button', { name: '阅读练习资料' })
    .click()
  expect(points(await state(page))).toBe(0)
  const exported = await download(page, info, 'earned-and-applied-rewards')
  expect(exported.text).not.toContain('示例学习者')
  await audit(info, 'reward-complete')
})
