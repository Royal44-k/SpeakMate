import { expect, test, type Page } from '@playwright/test'
import { createServer, request as httpRequest, type Server } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import vm from 'node:vm'
import {
  onboard,
  enterScene,
  capture,
  localState,
  protect,
} from './task7-browser-helpers'

// QA-only transparent same-origin transport. Both upstreams are actual frozen
// Next builds with their matching public directory; no route/body substitution.
let upstream = 3133
let server: Server
const transport: unknown[] = []
test.use({ baseURL: 'http://127.0.0.1:3134' })
test.beforeAll(async () => {
  server = createServer((req, res) => {
    const selected = upstream
    const forward = httpRequest(
      {
        hostname: '127.0.0.1',
        port: selected,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (response) => {
        transport.push({
          upstream: selected,
          path: req.url,
          method: req.method,
          status: response.statusCode,
        })
        res.writeHead(response.statusCode!, response.headers)
        response.pipe(res)
      },
    )
    forward.on('error', (error) => res.destroy(error))
    req.pipe(forward)
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(3134, '127.0.0.1', resolve)
  })
})
test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})
async function buildId(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const worker = navigator.serviceWorker.controller
        const timer = setTimeout(() => {
          navigator.serviceWorker.removeEventListener('message', listener)
          reject(new Error('Native worker did not identify build'))
        }, 5000)
        function listener(event: MessageEvent) {
          if (event.source === worker && event.data?.type === 'BUILD_ID') {
            clearTimeout(timer)
            navigator.serviceWorker.removeEventListener('message', listener)
            resolve(event.data.buildId)
          }
        }
        navigator.serviceWorker.addEventListener('message', listener)
        worker!.postMessage({ type: 'GET_BUILD_ID' })
      }),
  )
}
test('SW: real waiting build defers for another editing window, preserves old lazy bytes and committed IDB, then safely updates with enlarged navigation', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(180000)
  const finishNetwork = await protect(context, baseURL!)
  const oldManifestSource = await readFile(
    '.superpowers/sdd/2026-09-09-speakmate-3/qa/build-o3l7/public/offline-build.js',
    'utf8',
  )
  const sandbox = {
    self: {} as {
      SPEAKMATE_OFFLINE?: {
        buildId: string
        assets: { url: string; sha256: string }[]
      }
    },
  }
  vm.runInNewContext(oldManifestSource, sandbox)
  const old = sandbox.self.SPEAKMATE_OFFLINE!
  const latest = (await readFile('.next/BUILD_ID', 'utf8')).trim()
  expect(latest).not.toBe(old.buildId)
  upstream = 3133
  await onboard(page)
  expect(await buildId(page)).toBe(old.buildId)
  await enterScene(page, 'coffee-order', 'A2')
  const note = await capture(page, 'black', 'word')
  await page.getByRole('link', { name: '退出本次练习' }).click()
  await page.goto(`/notebook/note?id=${note.id}`)
  const saved = await localState(page)
  const editing = await context.newPage()
  await editing.goto(page.url())
  await editing.getByRole('button', { name: '编辑词句' }).click()
  const draft = editing.getByRole('textbox', { name: '个人备注', exact: true })
  await draft.fill('Synthetic unsubmitted note stays in this old window.')
  upstream = 3130
  await page.goto('/me')
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration())!.update()
  })
  await expect(page.getByText('新版本已准备好', { exact: true })).toBeVisible({
    timeout: 30000,
  })
  await expect(
    editing.getByRole('button', { name: '立即更新', exact: true }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: '立即更新', exact: true }).click()
  await expect(
    page.getByText(/请先完成并关闭其他 SpeakMate 窗口，再重试更新；/),
  ).toBeVisible()
  expect(await buildId(page)).toBe(old.buildId)
  await expect(draft).toHaveValue(
    'Synthetic unsubmitted note stays in this old window.',
  )
  // Request every actual old CSS/font/image/script URL after upstream changed.
  // Hashes must remain those of the old build, not just return status200.
  const lazy = await editing.evaluate(
    async (assets) =>
      Promise.all(
        assets.map(async (entry) => {
          const response = await fetch(entry.url),
            bytes = await response.arrayBuffer()
          const sha256 = Array.from(
            new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
            (byte) => byte.toString(16).padStart(2, '0'),
          ).join('')
          return {
            url: entry.url,
            status: response.status,
            sha256,
            expected: entry.sha256,
          }
        }),
      ),
    old.assets,
  )
  for (const entry of lazy) {
    expect(entry.status).toBe(200)
    expect(entry.sha256).toBe(entry.expected)
  }
  await expect(draft).toHaveValue(
    'Synthetic unsubmitted note stays in this old window.',
  )
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  const layout = await page.evaluate(() => {
    const rect = (element: Element) => {
      const r = element.getBoundingClientRect()
      return {
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
        height: r.height,
        width: r.width,
      }
    }
    const nav = document.querySelector('nav[aria-label="主要导航"]')!
    return {
      width: innerWidth,
      height: innerHeight,
      nav: rect(nav),
      notice: rect(document.querySelector('aside[role="status"]')!),
      links: Array.from(nav.querySelectorAll('a')).map((link) => ({
        link: rect(link),
        text: rect(link.querySelector('span')!),
      })),
    }
  })
  expect(layout.notice.bottom).toBeLessThanOrEqual(layout.nav.top)
  for (const { link, text } of layout.links) {
    expect(link.height).toBeGreaterThanOrEqual(44)
    expect(text.top).toBeGreaterThanOrEqual(link.top - 1)
    expect(text.bottom).toBeLessThanOrEqual(
      Math.min(link.bottom, layout.height) + 1,
    )
    expect(text.left).toBeGreaterThanOrEqual(link.left - 1)
    expect(text.right).toBeLessThanOrEqual(link.right + 1)
  }
  await page.screenshot({ path: info.outputPath('waiting-update-text200.png') })
  await page.goto('/scenes')
  await expect(page.getByRole('link', { name: /^准备练习：/ })).toHaveCount(42)
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await page
    .getByRole('link', { name: /^准备练习：/ })
    .last()
    .scrollIntoViewIfNeeded()
  await expect(
    page.getByRole('button', { name: '返回顶部', exact: true }),
  ).toBeVisible()
  const combined = await page.evaluate(() => {
    const rect = (element: Element) => {
      const r = element.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }
    }
    return {
      top: rect(document.querySelector('button[aria-label="返回顶部"]')!),
      notice: rect(document.querySelector('aside[role="status"]')!),
      nav: rect(document.querySelector('nav[aria-label="主要导航"]')!),
    }
  })
  expect(combined.top.bottom).toBeLessThanOrEqual(combined.notice.top)
  expect(combined.notice.bottom).toBeLessThanOrEqual(combined.nav.top)
  await page.screenshot({ path: info.outputPath('update-top-text200.png') })
  await page.getByRole('button', { name: '返回顶部', exact: true }).click()
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  await editing.getByRole('button', { name: '取消修改' }).click()
  expect((await localState(editing)).notebook).toEqual(saved.notebook)
  const selectedNoteUrl = editing.url()
  await editing.getByRole('link', { name: '返回来源练习', exact: true }).click()
  await editing
    .getByRole('region', { name: '当前问题', exact: true })
    .getByRole('button', { name: '记录词句' })
    .last()
    .click()
  await editing
    .getByRole('textbox', { name: '待存原文' })
    .fill('Unsaved synthetic capture remains local.')
  await expect(editing.getByRole('button', { name: '立即更新' })).toHaveCount(0)
  await page.getByRole('button', { name: '立即更新' }).click()
  await expect(
    page.getByText(/请先完成并关闭其他 SpeakMate 窗口，再重试更新；/),
  ).toBeVisible()
  await expect(editing.getByRole('textbox', { name: '待存原文' })).toHaveValue(
    'Unsaved synthetic capture remains local.',
  )
  await editing
    .getByRole('dialog')
    .getByRole('button', { name: '取消', exact: true })
    .click()
  expect((await localState(editing)).notebook).toEqual(saved.notebook)
  await editing.goto(selectedNoteUrl)
  await editing.getByRole('button', { name: '用所选来源模拟练习' }).click()
  await editing.getByRole('button', { name: '开始这次定向练习' }).click()
  await editing
    .getByRole('textbox', { name: '我回忆的表达' })
    .fill('Unsaved simulation recall remains protected.')
  await expect(editing.getByRole('button', { name: '立即更新' })).toHaveCount(0)
  await page.getByRole('button', { name: '立即更新' }).click()
  await expect(
    page.getByText(/请先完成并关闭其他 SpeakMate 窗口，再重试更新；/),
  ).toBeVisible()
  await expect(
    editing.getByRole('textbox', { name: '我回忆的表达' }),
  ).toHaveValue('Unsaved simulation recall remains protected.')
  await editing.getByRole('link', { name: '退出本次练习' }).click()
  await editing.getByRole('button', { name: '继续练习', exact: true }).click()
  await expect(
    editing.getByRole('textbox', { name: '我回忆的表达' }),
  ).toHaveValue('Unsaved simulation recall remains protected.')
  await editing.getByRole('button', { name: '取消本次输入' }).click()
  const simulationId = new URL(editing.url()).searchParams.get('id')!
  await editing.close()
  // Closing the actual simulation legitimately flushes its foreground segment;
  // wait for that owned transaction before taking the update checkpoint.
  await expect
    .poll(async () =>
      (await localState(page)).learningEvents.some(
        (event) =>
          event.type === 'foreground-time-recorded' &&
          event.runId.startsWith(`${simulationId}_`),
      ),
    )
    .toBe(true)
  const committedBeforeUpdate = await localState(page)
  await page.goto('/me')
  const reload = page.waitForEvent('load')
  const newcomer = await context.newPage()
  // Race a real newly arriving in-scope document against explicit activation.
  const arriving = newcomer.goto('/notebook')
  await page.getByRole('button', { name: '立即更新', exact: true }).click()
  await arriving
  const racedBuild = await buildId(page)
  if (racedBuild === old.buildId) {
    await expect(
      page.getByText(/请先完成并关闭其他 SpeakMate 窗口，再重试更新；/),
    ).toBeVisible()
    await newcomer.close()
    await page.getByRole('button', { name: '立即更新', exact: true }).click()
  } else {
    expect(racedBuild).toBe(latest)
    await expect(
      newcomer.getByRole('heading', { name: '记录簿', exact: true }),
    ).toBeVisible()
    await newcomer.close()
  }
  await reload
  await expect(page.getByRole('region', { name: '本机个人成绩' })).toBeVisible()
  expect(await buildId(page)).toBe(latest)
  const after = await localState(page)
  expect(after).toEqual(committedBeforeUpdate)
  const cachesKept = await page.evaluate(() => caches.keys())
  expect(cachesKept).toContain(`speakmate-build-v1-${old.buildId}`)
  expect(cachesKept).toContain(`speakmate-build-v1-${latest}`)
  await writeFile(
    info.outputPath('real-update.json'),
    JSON.stringify(
      {
        old: old.buildId,
        latest,
        lazy,
        layout,
        combined,
        racedBuild,
        cachesKept,
        after,
        transport,
        oldManifestHash: createHash('sha256')
          .update(oldManifestSource)
          .digest('hex'),
      },
      null,
      2,
    ),
  )
  await finishNetwork(info)
})

for (const fault of ['body-deadline', 'controller-change'] as const) {
  test(`SW: native category ${fault} rejects without late learning writes`, async ({
    page,
    context,
    baseURL,
  }, info) => {
    test.setTimeout(90000)
    const audit = await protect(context, baseURL!)
    upstream = 3133
    // Keep native fetch/status/headers/body. Only document-side delivery of the
    // real clone's arrayBuffer is held; this is not a server streaming test.
    await context.addInitScript(() => {
      const nativeFetch = window.fetch.bind(window)
      const state = {
        armed: true,
        held: false,
        released: false,
        url: '',
        headers: {} as Record<string, string>,
        bytes: 0,
        sha256: '',
        started: 0,
      }
      Object.assign(window, { __bodyFault: state })
      window.fetch = async (...args) => {
        const response = await nativeFetch(...args)
        const input = args[0],
          path =
            typeof input === 'string'
              ? input
              : input instanceof URL
                ? input.href
                : input.url
        if (!state.armed || !path.includes('/content/v1/')) return response
        state.armed = false
        const clone = response.clone.bind(response)
        Object.defineProperty(response, 'clone', {
          value: () => {
            const copy = clone()
            const read = copy.arrayBuffer.bind(copy)
            Object.defineProperty(copy, 'arrayBuffer', {
              value: async () => {
                const bytes = await read()
                state.url = response.url
                state.headers = Object.fromEntries(response.headers)
                state.bytes = bytes.byteLength
                state.sha256 = Array.from(
                  new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
                  (byte) => byte.toString(16).padStart(2, '0'),
                ).join('')
                state.started = performance.now()
                state.held = true
                await new Promise<void>((resolve) =>
                  Object.assign(window, {
                    __releaseBody: () => {
                      state.released = true
                      resolve()
                    },
                  }),
                )
                return bytes
              },
            })
            return copy
          },
        })
        return response
      }
    })
    await onboard(page)
    const oldBuild = await buildId(page)
    const before = await localState(page)
    await page.getByRole('button', { name: '准备表达热身' }).click()
    await page.waitForFunction(
      () =>
        (window as unknown as { __bodyFault: { held: boolean } }).__bodyFault
          .held,
    )
    expect(await localState(page)).toEqual(before)
    if (fault === 'controller-change') {
      upstream = 3130
      await page.evaluate(async () => {
        await (await navigator.serviceWorker.getRegistration())!.update()
      })
      // Protocol fault injection: deliberately bypass UI's busy-update guard.
      // The real waiting worker itself verifies this single-window request.
      const activation = await page.evaluate(async () => {
        const old = navigator.serviceWorker.controller
        const registration = (await navigator.serviceWorker.getRegistration())!
        const messages: unknown[] = []
        navigator.serviceWorker.addEventListener('message', (event) =>
          messages.push(event.data),
        )
        const waiting = await new Promise<ServiceWorker>((resolve, reject) => {
          const deadline = performance.now() + 15000
          function check() {
            if (registration.waiting) {
              resolve(registration.waiting)
              return
            }
            if (performance.now() > deadline) {
              reject(
                new Error(
                  `No waiting worker: active=${registration.active?.state}; installing=${registration.installing?.state}`,
                ),
              )
              return
            }
            setTimeout(check, 50)
          }
          check()
        })
        const changed = await new Promise<boolean>((resolve) => {
          const timer = setTimeout(() => resolve(false), 20000)
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => {
              if (navigator.serviceWorker.controller !== old) {
                clearTimeout(timer)
                resolve(true)
              }
            },
            { once: true },
          )
          waiting.postMessage({ type: 'SKIP_WAITING' })
        })
        return {
          changed,
          messages,
          waitingState: waiting.state,
          active: registration.active?.scriptURL,
          controller: navigator.serviceWorker.controller?.scriptURL,
        }
      })
      await writeFile(
        info.outputPath('native-activation.json'),
        JSON.stringify({ activation, transport }, null, 2),
      )
      expect(activation.changed).toBe(true)
      expect(await buildId(page)).not.toBe(oldBuild)
    }
    await expect(
      page.getByRole('alert').filter({ hasText: '所选任务保持原样' }),
    ).toBeVisible({ timeout: 35000 })
    const evidence = await page.evaluate(() => {
      const state = (window as unknown as { __bodyFault: { started: number } })
        .__bodyFault
      return { ...state, elapsedMs: performance.now() - state.started }
    })
    if (fault === 'body-deadline') {
      expect(evidence.elapsedMs).toBeGreaterThan(29000)
      expect(evidence.elapsedMs).toBeLessThan(35000)
    }
    expect(await localState(page)).toEqual(before)
    await page.evaluate(() =>
      (window as unknown as { __releaseBody: () => void }).__releaseBody(),
    )
    // Native microtasks and a paint after released bytes; the rejected request
    // must not secretly become a prepared workflow or write any learning row.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    )
    await expect(
      page.getByRole('region', { name: '表达热身流程' }),
    ).toHaveCount(0)
    expect(await localState(page)).toEqual(before)
    await expect(
      page.getByRole('button', { name: '准备表达热身' }),
    ).toBeEnabled()
    await page.screenshot({
      path: info.outputPath('native-category-fault.png'),
    })
    await writeFile(
      info.outputPath('native-category-fault.json'),
      JSON.stringify(
        { fault, oldBuild, evidence, before, after: await localState(page) },
        null,
        2,
      ),
    )
    await audit(info)
  })
}
