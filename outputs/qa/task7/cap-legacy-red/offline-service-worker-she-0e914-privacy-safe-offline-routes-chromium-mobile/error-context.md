# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline.spec.ts >> service worker shell contains the privacy-safe offline routes
- Location: tests\e2e\offline.spec.ts:3:1

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "'/offline/session'"
Received string:    "/* Generated manifest changes participate in the service worker update check. */
importScripts('/offline-build.js')
const manifest = self.SPEAKMATE_OFFLINE
const PREFIX = 'speakmate-build-v1-'
const LEGACY = 'speakmate-v2.3.0-shell-r1'
const validEntry = (entry) =>
  entry &&
  typeof entry.url === 'string' &&
  entry.url.startsWith('/') &&
  !entry.url.startsWith('//') &&
  !/[?#\\\\]/.test(entry.url) &&
  /^[a-f0-9]{64}$/.test(entry.sha256) &&
  Number.isSafeInteger(entry.bytes) &&
  entry.bytes > 0 &&
  entry.bytes < 20_000_000
if (
  !manifest ||
  manifest.schemaVersion !== 1 ||
  !/^[\\w-]{1,100}$/.test(manifest.buildId) ||
  !['shells', 'assets', 'categories'].every(
    (key) =>
      Array.isArray(manifest[key]) &&
      manifest[key].length > 0 &&
      manifest[key].length < 2000 &&
      manifest[key].every(validEntry),
  )
)
  throw new Error('Unsupported or missing offline build manifest')
const entries = [...manifest.shells, ...manifest.assets, ...manifest.categories]
if (
  new Set(entries.map((entry) => entry.url)).size !== entries.length ||
  manifest.assets.some(
    (entry) =>
      !/^\\/(?:_next\\/static|icons)\\//.test(entry.url) &&
      !/^\\/scenes\\/(?:travel|dining|daily|work|social|study|emergency|hotel)\\.webp$/.test(
        entry.url,
      ),
  ) ||
  manifest.categories.some(
    (entry) => !/^\\/content\\/v1\\/[a-z-]+$/.test(entry.url),
  )
)
  throw new Error('Invalid offline public resource boundary')
const CACHE = PREFIX + manifest.buildId
const ACTIVATION = '/.speakmate/offline-activation-v1'
const ownedBuild = (name) =>
  name.startsWith(PREFIX) && /^[\\w-]{1,100}$/.test(name.slice(PREFIX.length))
const lookup = (list, path) => list.find((entry) => entry.url === path)·
async function verified(response, entry, document = false, network = false) {
  if (!response?.ok) throw new Error('Resource unavailable')
  if (
    network &&
    new URL(response.url).href !== new URL(entry.url, self.location.origin).href
  )
    throw new Error('Resource redirected')
  const type = response.headers.get('content-type') ?? ''
  if (document && !type.includes('text/html'))
    throw new Error('Not document HTML')
  if (entry.url.startsWith('/content/') && !type.includes('application/json'))
    throw new Error('Not category JSON')
  const bytes = await response.clone().arrayBuffer()
  if (bytes.byteLength !== entry.bytes)
    throw new Error('Resource size mismatch')
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  if (hash !== entry.sha256) throw new Error('Resource build mismatch')
  return response
}·
async function obtain(entry, document = false) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(entry.url)
  if (cached) {
    try {
      return await verified(cached, entry, document)
    } catch {
      /* Retry damaged cache. */
    }
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  try {
    const response = await verified(
      await fetch(entry.url, {
        credentials: 'omit',
        cache: 'no-cache',
        signal: controller.signal,
      }),
      entry,
      document,
      true,
    )
    await cache.put(entry.url, response.clone())
    return response
  } finally {
    clearTimeout(timeout)
  }
}·
self.addEventListener('install', (event) => {
  // Category bodies are deliberately absent: each is prepared on demand.
  event.waitUntil(
    Promise.all([
      ...manifest.shells.map((entry) => obtain(entry, true)),
      ...manifest.assets.map((entry) => obtain(entry)),
    ]),
  )
})·
async function windows() {
  let timer
  try {
    return await Promise.race([
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Client check timed out')),
          2000,
        )
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}·
self.addEventListener('message', (event) => {
  if (
    event.data?.type === 'CATEGORY_BUILD' &&
    event.data.schemaVersion === 1 &&
    typeof event.data.requestId === 'string' &&
    /^[\\w-]{1,100}$/.test(event.data.requestId)
  ) {
    const entry = manifest.categories.find(
      (entry) => entry.url === `/content/v1/${event.data.category}`,
    )
    if (entry)
      event.source?.postMessage({
        type: 'CATEGORY_BUILD',
        schemaVersion: 1,
        requestId: event.data.requestId,
        category: event.data.category,
        buildId: manifest.buildId,
        sha256: entry.sha256,
        bytes: entry.bytes,
      })
  }
  if (event.data?.type === 'GET_BUILD_ID')
    event.source?.postMessage({ type: 'BUILD_ID', buildId: manifest.buildId })
  if (event.data?.type === 'SKIP_WAITING')
    event.waitUntil(
      (async () => {
        try {
          const clients = await windows()
          if (
            !event.source?.id ||
            !clients.some((client) => client.id === event.source.id) ||
            clients.some((client) => client.id !== event.source.id)
          )
            throw new Error('Other or unknown window')
          await self.skipWaiting()
        } catch {
          event.source?.postMessage({
            type: 'UPDATE_DEFERRED',
            message:
              '请先完成并关闭其他 SpeakMate 窗口，再重试更新。无法确认窗口状态时也会暂缓更新。',
          })
        }
      })(),
    )
  if (event.data?.type === 'OFFLINE_STATUS')
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE)
        const ready = async (list) =>
          (
            await Promise.all(
              list.map(async (entry) => {
                try {
                  await verified(
                    await cache.match(entry.url),
                    entry,
                    manifest.shells.includes(entry),
                  )
                  return true
                } catch {
                  return false
                }
              }),
            )
          ).every(Boolean)
        event.source?.postMessage({
          type: 'OFFLINE_STATUS',
          buildId: manifest.buildId,
          shellReady: await ready([...manifest.shells, ...manifest.assets]),
          categories: Object.fromEntries(
            await Promise.all(
              manifest.categories.map(async (entry) => [
                entry.url.split('/').at(-1),
                await ready([entry]),
              ]),
            ),
          ),
        })
      })(),
    )
})·
self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      // Activation events for this registration are serialized. Only activation
      // writes this bounded marker; a newer install cache is not an active build.
      // Zero windows is NOT a lock: retain the actual prior activated build for a
      // window arriving after the check. Any present window defers all old deletion.
      // Legacy2.3 and missing/failed/unknown markers remain conservative anchors.
      try {
        const owned = (await caches.keys()).filter(ownedBuild)
        if (owned.length > 64)
          throw new Error('Too many build markers to establish bounded history')
        const markers = []
        for (const name of owned) {
          if (name === CACHE) continue
          try {
            const response = await (await caches.open(name)).match(ACTIVATION)
            const text = response ? await response.text() : ''
            if (text.length > 300) continue
            const value = JSON.parse(text)
            if (
              Object.keys(value).sort().join(',') !==
                'buildId,generation,schemaVersion' ||
              value.schemaVersion !== 1 ||
              value.buildId !== name.slice(PREFIX.length) ||
              !Number.isSafeInteger(value.generation) ||
              value.generation < 1 ||
              value.generation >= 1000000000
            )
              continue
            markers.push({ name, generation: value.generation })
          } catch {
            /* Unknown marker: retain its resources. */
          }
        }
        const priorGeneration = Math.max(
          0,
          ...markers.map((value) => value.generation),
        )
        if (priorGeneration >= 999999998)
          throw new Error('Activation generation limit')
        const activeCache = await caches.open(CACHE)
        const markerText = JSON.stringify({
          schemaVersion: 1,
          buildId: manifest.buildId,
          generation: priorGeneration + 1,
        })
        await activeCache.put(
          ACTIVATION,
          new Response(markerText, {
            headers: { 'content-type': 'application/json' },
          }),
        )
        const persisted = await activeCache.match(ACTIVATION)
        if (!persisted || (await persisted.text()) !== markerText)
          throw new Error('Activation marker was not persisted')
        if ((await windows()).length === 0) {
          await Promise.all(
            markers
              .filter((value) => value.generation < priorGeneration)
              .map((value) => caches.delete(value.name)),
          )
        }
      } catch {
        /* Unknown clients or a failed marker are not permission to delete. */
      }
      await self.clients.claim()
    })(),
  ),
)·
function publicSource(href) {
  if (
    typeof href !== 'string' ||
    href.length > 2000 ||
    !href.startsWith('/') ||
    href.startsWith('//') ||
    href.includes('\\\\')
  )
    return null
  const url = new URL(href, self.location.origin)
  if (url.origin !== self.location.origin) return null
  const legacy = legacyTarget(url, false)
  if (legacy)
    return publicSource(new URL(legacy).pathname + new URL(legacy).search)
  if (
    ![
      '/',
      '/practice',
      '/scenes',
      '/notebook',
      '/me',
      '/privacy',
      '/install',
      '/welcome',
      '/auth',
      '/guide',
      '/rewards',
      '/session',
      '/session/report',
      '/scenes/prepare',
      '/notebook/note',
      '/notebook/simulation',
    ].includes(url.pathname)
  )
    return null
  const target = new URL(url.pathname, url.origin)
  for (const key of [
    'id',
    'scene',
    'level',
    'mode',
    'round',
    'category',
    'duration',
    'source',
    'date',
    'task',
  ]) {
    const values = url.searchParams.getAll(key)
    if (values.length !== 1) continue
    const value = values[0]
    const valid =
      key === 'date'
        ? url.pathname === '/' &&
          /^\\d{4}-\\d{2}-\\d{2}$/.test(value) &&
          Number.isFinite(Date.parse(value + 'T00:00:00Z')) &&
          new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value
        : key === 'task'
          ? url.pathname === '/' &&
            ['warmup', 'scene', 'consolidation', 'extension'].includes(value)
          : key === 'level'
            ? /^(A1|A2|B1|B2|C1)$/.test(value)
            : key === 'mode'
              ? /^(short|standard|extended)$/.test(value)
              : key === 'category'
                ? /^(travel|dining|daily|work|social|study|emergency)$/.test(
                    value,
                  )
                : key === 'duration'
                  ? /^(3|5|8|10)$/.test(value)
                  : key === 'scene'
                    ? /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) &&
                      value.length <= 100
                    : /^[\\w.:-]{1,120}$/.test(value)
    if (valid) target.searchParams.set(key, value)
  }
  return target.pathname + target.search
}·
function legacyTarget(url, includeFrom = true) {
  if (url.pathname === '/practice/today')
    return new URL('/practice', url.origin).href
  const report = url.pathname.match(/^\\/session\\/([\\w.:-]{1,120})\\/report$/)
  const session = url.pathname.match(/^\\/session\\/([\\w.:-]{1,120})$/)
  const scene = url.pathname.match(/^\\/scenes\\/([a-z0-9-]{1,100})$/)
  let path, key, value
  if (report && !['new', 'report'].includes(report[1])) {
    path = '/session/report'
    key = 'id'
    value = report[1]
  } else if (session && !['report', 'prepare'].includes(session[1])) {
    path = '/session'
    key = 'id'
    value = session[1]
  } else if (scene && scene[1] !== 'prepare') {
    path = '/scenes/prepare'
    key = 'scene'
    value = scene[1]
  } else return null
  const target = new URL(path, url.origin)
  target.searchParams.set(key, value)
  for (const name of path === '/session'
    ? ['scene', 'level', 'mode', 'round']
    : path === '/scenes/prepare'
      ? ['level', 'mode']
      : []) {
    const values = url.searchParams.getAll(name)
    // Keep invalid/duplicate public options invalid at the canonical recovery
    // shell; never silently default them into a new selection. No free text.
    if (
      values.length > 1 ||
      (values.length === 1 && !/^[\\w.:-]{1,120}$/.test(values[0]))
    ) {
      target.searchParams.set('invalid', '1')
      continue
    }
    if (values.length === 1) target.searchParams.set(name, values[0])
  }
  if (includeFrom && url.searchParams.getAll('from').length === 1) {
    const source = publicSource(url.searchParams.get('from'))
    if (source) target.searchParams.set('from', source)
  }
  if (includeFrom && url.searchParams.getAll('from').length > 1)
    target.searchParams.set('invalid', '1')
  return target.href
}·
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    request.destination === 'audio' ||
    request.headers.has('RSC') ||
    request.headers.has('Next-Router-Prefetch') ||
    url.searchParams.has('_rsc')
  )
    return
  if (request.mode === 'navigate') {
    const legacy = legacyTarget(url)
    if (legacy) {
      event.respondWith(Promise.resolve(Response.redirect(legacy, 302)))
      return
    }
    const shell = lookup(manifest.shells, url.pathname)
    if (shell)
      event.respondWith(
        obtain(shell, true).catch(
          () =>
            new Response(
              '此页面尚未完整准备，联网后重试；本机学习记录未清除。',
              {
                status: 503,
                headers: { 'content-type': 'text/plain; charset=utf-8' },
              },
            ),
        ),
      )
    return
  }
  if (url.search) return
  const entry =
    lookup(manifest.assets, url.pathname) ??
    lookup(manifest.categories, url.pathname)
  if (entry) {
    event.respondWith(
      obtain(entry)
        .then((response) => {
          if (!manifest.categories.includes(entry)) return response
          const headers = new Headers(response.headers)
          headers.set('x-speakmate-build', manifest.buildId)
          headers.set('x-speakmate-category-sha256', entry.sha256)
          return new Response(response.body, {
            status: response.status,
            headers,
          })
        })
        .catch(
          () =>
            new Response(
              'Public resource unavailable; retry preparation online.',
              { status: 503 },
            ),
        ),
    )
    return
  }
  // Only our retained immutable static resources support older clients.
  if (url.pathname.startsWith('/_next/static/'))
    event.respondWith(
      (async () => {
        for (const name of (await caches.keys())
          .filter((key) => key === LEGACY || ownedBuild(key))
          .reverse()) {
          const response = await (await caches.open(name)).match(url.href)
          if (response) return response
        }
        return fetch(request)
      })(),
    )
})
"
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test'
  2   | 
  3   | test('service worker shell contains the privacy-safe offline routes', async ({
  4   |   request,
  5   | }) => {
  6   |   const response = await request.get('/sw.js')
  7   |   const source = await response.text()
  8   |   expect(source).toContain('speakmate-v2.3.0-shell-r1')
  9   |   for (const path of [
  10  |     "'/'",
  11  |     "'/install'",
  12  |     "'/scenes'",
  13  |     "'/offline/session'",
  14  |     "'/manifest.webmanifest'",
  15  |   ]) {
> 16  |     expect(source).toContain(path)
      |                    ^ Error: expect(received).toContain(expected) // indexOf
  17  |   }
  18  |   expect(source).toContain("pathname.startsWith('/scenes/')")
  19  |   expect(source).toContain("pathname.startsWith('/session/')")
  20  |   expect(source).toContain("networkFirst(request, '/offline/session', false)")
  21  |   expect(source).toContain("url.pathname.startsWith('/api/')")
  22  |   expect(source).toContain("request.destination === 'audio'")
  23  |   expect(source).toContain("event.data?.type === 'SKIP_WAITING'")
  24  |   expect(source).toContain('3_000')
  25  | })
  26  | 
  27  | test('installed public shell remains available after the network goes offline', async ({
  28  |   page,
  29  |   context,
  30  |   browserName,
  31  | }) => {
  32  |   test.skip(
  33  |     browserName !== 'chromium',
  34  |     'Offline service-worker verification runs in the Chromium production target.',
  35  |   )
  36  |   await page.goto('/')
  37  |   await page.evaluate(async () => {
  38  |     await navigator.serviceWorker.ready
  39  |   })
  40  |   if (
  41  |     !(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
  42  |   ) {
  43  |     await page.reload()
  44  |   }
  45  |   await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  46  |   await page.goto('/install')
  47  |   await expect(
  48  |     page.getByRole('heading', { level: 1, name: '安装到手机' }),
  49  |   ).toBeVisible()
  50  |   await expect(
  51  |     page.getByRole('heading', { level: 2, name: '把练习放到主屏幕' }),
  52  |   ).toBeVisible()
  53  |   expect(
  54  |     await page.evaluate(async () => Boolean(await caches.match('/install'))),
  55  |   ).toBe(true)
  56  | 
  57  |   await context.setOffline(true)
  58  |   await page.reload({ waitUntil: 'domcontentloaded' })
  59  |   await expect(
  60  |     page.getByRole('heading', { level: 1, name: '安装到手机' }),
  61  |   ).toBeVisible()
  62  |   await expect(
  63  |     page.getByRole('heading', { level: 2, name: '把练习放到主屏幕' }),
  64  |   ).toBeVisible()
  65  |   await context.setOffline(false)
  66  | })
  67  | 
  68  | test('visited scene library and local session shell recover offline', async ({
  69  |   page,
  70  |   context,
  71  |   browserName,
  72  | }) => {
  73  |   test.skip(
  74  |     browserName !== 'chromium',
  75  |     'Offline service-worker verification runs in the Chromium production target.',
  76  |   )
  77  |   await page.goto('/')
  78  |   await page.evaluate(async () => {
  79  |     await navigator.serviceWorker.ready
  80  |   })
  81  |   if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))))
  82  |     await page.reload()
  83  |   await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  84  | 
  85  |   await page.goto('/scenes')
  86  |   await expect(page.locator('h1')).toContainText('把英语练进生活里')
  87  |   await context.setOffline(true)
  88  |   await page.reload({ waitUntil: 'domcontentloaded' })
  89  |   await expect(page.locator('h1')).toContainText('把英语练进生活里')
  90  | 
  91  |   await context.setOffline(false)
  92  |   await page.goto('/session/new?scene=hotel-check-in&level=B1')
  93  |   await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  94  |   const sessionId = await page.evaluate(async () => {
  95  |     const database = await new Promise<IDBDatabase>((resolve, reject) => {
  96  |       const request = indexedDB.open('speakmate-v1')
  97  |       request.onsuccess = () => resolve(request.result)
  98  |       request.onerror = () => reject(request.error)
  99  |     })
  100 |     const sessions = await new Promise<Array<{ id: string }>>(
  101 |       (resolve, reject) => {
  102 |         const request = database
  103 |           .transaction('sessions', 'readonly')
  104 |           .objectStore('sessions')
  105 |           .getAll()
  106 |         request.onsuccess = () => resolve(request.result)
  107 |         request.onerror = () => reject(request.error)
  108 |       },
  109 |     )
  110 |     database.close()
  111 |     return sessions[0]?.id
  112 |   })
  113 |   expect(sessionId).toBeTruthy()
  114 |   await page.goto(`/session/${sessionId}`)
  115 |   await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  116 |   const privateSessionUrl = page.url()
```