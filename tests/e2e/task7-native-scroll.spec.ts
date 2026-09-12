import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import {
  onboard,
  enterScene,
  capture,
  localState,
  protect,
} from './task7-browser-helpers'

test('H: actual captured scrollable notebook restores nonzero source focus after delayed native document read and remains safe with denied session storage', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(180000)
  const finishNetwork = await protect(context, baseURL!)
  await onboard(page)
  await enterScene(page, 'ask-teacher', 'A2')
  await capture(page, 'for example', 'phrase')
  for (let index = 0; index < 8; index++)
    await capture(page, `synthetic example number ${index}`, 'phrase')
  await page.getByRole('link', { name: '退出本次练习' }).click()
  await page.goto('/notebook')
  await page.getByRole('textbox', { name: '搜索词句与备注' }).fill('example')
  await expect(page.getByRole('article')).toHaveCount(9)
  const selectedText = await page
    .getByRole('article')
    .last()
    .getByRole('heading')
    .innerText()
  const link = page
    .getByRole('article')
    .last()
    .getByRole('link', { name: '查看词句', exact: true })
  const selectedId = new URL(
    (await link.getAttribute('href'))!,
    baseURL,
  ).searchParams.get('id')!
  await link.scrollIntoViewIfNeeded()
  await link.focus()
  const position = await page.evaluate(() => scrollY)
  expect(position).toBeGreaterThan(300)
  await link.click()
  await expect(
    page.getByRole('heading', { name: selectedText, exact: true }),
  ).toBeVisible()
  const noteUrl = page.url()
  // Hold only the native notebook getAll delivery in the next document. The
  // actual IDB operation/transaction executes; no fixture rows replace it.
  await page.addInitScript(() => {
    if (location.pathname !== '/notebook') return
    const pending: (() => void)[] = []
    let released = false
    const getAll = IDBObjectStore.prototype.getAll
    IDBObjectStore.prototype.getAll = function (...args) {
      const request = Reflect.apply(getAll, this, args) as IDBRequest
      if (this.name === 'notebook' && this.transaction.mode === 'readonly') {
        const add = request.addEventListener.bind(request)
        Object.defineProperty(request, 'addEventListener', {
          value(
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | AddEventListenerOptions,
          ) {
            if (type !== 'success') return add(type, listener, options)
            return add(
              type,
              (event) => {
                const deliver = () =>
                  typeof listener === 'function'
                    ? listener.call(request, event)
                    : listener.handleEvent(event)
                if (released) deliver()
                else pending.push(deliver)
              },
              options,
            )
          },
        })
      }
      return request
    }
    Object.assign(window, {
      __heldNotebook: pending,
      __releaseNotebook: () => {
        released = true
        while (pending.length) pending.shift()!()
      },
    })
  })
  await page.getByRole('link', { name: '返回记录簿', exact: true }).click()
  await expect(page).toHaveURL(/\/notebook$/)
  await page.waitForFunction(
    () =>
      (window as unknown as { __heldNotebook?: unknown[] }).__heldNotebook
        ?.length,
  )
  const delayed = await page.evaluate(
    () =>
      !!(window as unknown as { __heldNotebook?: unknown[] }).__heldNotebook
        ?.length,
  )
  expect(delayed).toBe(true)
  const pendingPosition = await page.evaluate(() => scrollY)
  await page.evaluate(() =>
    (
      window as unknown as { __releaseNotebook?: () => void }
    ).__releaseNotebook?.(),
  )
  await expect(link).toBeFocused()
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300)
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - position),
  ).toBeLessThan(3)
  await expect(
    page.getByRole('textbox', { name: '搜索词句与备注' }),
  ).toHaveValue('example')
  const returnedPosition = await page.evaluate(() => scrollY)
  await page.screenshot({ path: info.outputPath('nonzero-restored.png') })
  await page.goBack()
  await expect(page).toHaveURL(noteUrl)
  await page.goForward()
  await expect(page).toHaveURL(/\/notebook$/)
  // BFCache may preserve the already released document; a fresh document has
  // another real delivery to release. Both are native navigation outcomes.
  await page.waitForFunction(
    () =>
      !!document.querySelector('article') ||
      (window as unknown as { __heldNotebook?: unknown[] }).__heldNotebook
        ?.length,
  )
  await page.evaluate(() =>
    (
      window as unknown as { __releaseNotebook?: () => void }
    ).__releaseNotebook?.(),
  )
  await expect(link).toBeVisible()
  const intact = await localState(page)
  expect(intact.notebook).toHaveLength(9)
  expect(intact.sessions).toHaveLength(1)
  await page.addInitScript(() => {
    const set = Storage.prototype.setItem,
      get = Storage.prototype.getItem
    Storage.prototype.setItem = function (...args) {
      if (this === window.sessionStorage)
        throw new DOMException(
          'Synthetic denied session storage',
          'SecurityError',
        )
      return Reflect.apply(set, this, args)
    }
    Storage.prototype.getItem = function (...args) {
      if (this === window.sessionStorage)
        throw new DOMException(
          'Synthetic denied session storage',
          'SecurityError',
        )
      return Reflect.apply(get, this, args)
    }
  })
  await page.goto(`/notebook/note?id=${selectedId}`)
  await expect(
    page.getByRole('heading', { name: selectedText, exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: '返回记录簿', exact: true }).click()
  await page.waitForFunction(
    () =>
      (window as unknown as { __heldNotebook: unknown[] }).__heldNotebook
        .length > 0,
  )
  await page.evaluate(() =>
    (
      window as unknown as { __releaseNotebook: () => void }
    ).__releaseNotebook(),
  )
  await expect(
    page.getByRole('heading', { name: '记录簿', exact: true }),
  ).toBeVisible()
  expect((await localState(page)).notebook).toEqual(intact.notebook)
  await writeFile(
    info.outputPath('native-scroll.json'),
    JSON.stringify(
      {
        position,
        delayed,
        pendingPosition,
        returnedPosition,
        noteUrl,
        state: intact,
        deniedStorage: 'explicit safe return; no precise position claimed',
      },
      null,
      2,
    ),
  )
  await finishNetwork(info)
})

test('N1: trusted native Back leads rendered Next route; delayed destination IDB preserves the unconsumed entry and restores its nonzero anchor', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(90000)
  const finishNetwork = await protect(context, baseURL!)
  await page.addInitScript(() => {
    const qa = {
      armed: false,
      holdReads: false,
      nextHandlers: 0,
      native: [] as {
        trusted: boolean
        url: string
        entry: unknown
        title: string | null
        stack: string | null
      }[],
      pop: [] as (() => void)[],
      reads: [] as (() => void)[],
      nextSources: [] as string[],
    }
    Object.assign(window, { __nativeBoundary: qa })
    const add = window.addEventListener.bind(window)
    const remove = window.removeEventListener.bind(window)
    const replacements = new Map<
      EventListenerOrEventListenerObject,
      EventListener
    >()
    // Pinned installed Next handler is identified by its actual tree-state read.
    // Only its delivery is held; the original trusted event reaches our route owner.
    window.addEventListener = ((
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) => {
      if (
        type === 'popstate' &&
        String(listener).includes('__PRIVATE_NEXTJS_INTERNALS_TREE')
      ) {
        qa.nextHandlers++
        qa.nextSources.push(String(listener))
        const wrapped: EventListener = (event) => {
          const deliver = () =>
            typeof listener === 'function'
              ? listener.call(window, event)
              : listener.handleEvent(event)
          if (qa.armed) {
            qa.native.push({
              trusted: event.isTrusted,
              url: location.href,
              entry: history.state?.__speakmateRouteEntry,
              title:
                document.querySelector('[data-page-title]')?.textContent ??
                null,
              stack: sessionStorage.getItem('speakmate-route-stack'),
            })
            qa.pop.push(deliver)
          } else deliver()
        }
        replacements.set(listener, wrapped)
        return add(type, wrapped, options)
      }
      return add(type, listener, options)
    }) as typeof window.addEventListener
    window.removeEventListener = ((
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ) =>
      remove(
        type,
        replacements.get(listener) ?? listener,
        options,
      )) as typeof window.removeEventListener
    const getAll = IDBObjectStore.prototype.getAll
    IDBObjectStore.prototype.getAll = function (...args) {
      const request = Reflect.apply(getAll, this, args) as IDBRequest
      if (
        qa.holdReads &&
        this.name === 'notebook' &&
        this.transaction.mode === 'readonly'
      ) {
        const on = request.addEventListener.bind(request)
        Object.defineProperty(request, 'addEventListener', {
          value(
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | AddEventListenerOptions,
          ) {
            if (type !== 'success') return on(type, listener, options)
            return on(
              type,
              (event) => {
                const deliver = () =>
                  typeof listener === 'function'
                    ? listener.call(request, event)
                    : listener.handleEvent(event)
                if (qa.holdReads) qa.reads.push(deliver)
                else deliver()
              },
              options,
            )
          },
        })
      }
      return request
    }
  })
  await onboard(page)
  await enterScene(page, 'ask-teacher', 'A2')
  await capture(page, 'for example', 'phrase')
  for (let index = 0; index < 8; index++)
    await capture(page, `synthetic example number ${index}`, 'phrase')
  await page.getByRole('link', { name: '退出本次练习' }).click()
  await page.goto('/notebook')
  await page.getByRole('textbox', { name: '搜索词句与备注' }).fill('example')
  await expect(page.getByRole('article')).toHaveCount(9)
  const link = page
    .getByRole('article')
    .last()
    .getByRole('link', { name: '查看词句', exact: true })
  const noteHref = (await link.getAttribute('href'))!
  const noteTitle = await page
    .getByRole('article')
    .last()
    .getByRole('heading')
    .innerText()
  await link.scrollIntoViewIfNeeded()
  await link.focus()
  await page.evaluate(() => scrollBy(0, -1))
  await page.waitForFunction(
    (href) =>
      JSON.parse(
        sessionStorage.getItem('speakmate-route-scroll-v1') ?? '[]',
      ).some((row: unknown[]) => row[2] === href && Number(row[1]) > 300),
    noteHref,
  )
  const original = await page.evaluate(() => ({
    url: location.href,
    state: history.state,
    position: scrollY,
    stack: sessionStorage.getItem('speakmate-route-stack'),
    scrolls: sessionStorage.getItem('speakmate-route-scroll-v1'),
  }))
  // Installed Next exposes the real public router for debugging. This isolated
  // compatibility test uses it, not a product link or a second router.
  await page.evaluate(
    (href) =>
      (
        window as unknown as {
          next: {
            router: {
              push: (href: string, options: { scroll: boolean }) => void
            }
          }
        }
      ).next.router.push(href, { scroll: false }),
    noteHref,
  )
  await expect(page).toHaveURL(new URL(noteHref, baseURL).href)
  await expect(
    page.getByRole('heading', { name: noteTitle, exact: true }),
  ).toBeVisible()
  const before = await page.evaluate(() => ({
    url: location.href,
    stack: sessionStorage.getItem('speakmate-route-stack'),
    scrolls: sessionStorage.getItem('speakmate-route-scroll-v1'),
  }))
  const beforeData = await localState(page)
  await page.evaluate(() => {
    const qa = (
      window as unknown as {
        __nativeBoundary: { armed: boolean; holdReads: boolean }
      }
    ).__nativeBoundary
    qa.armed = true
    qa.holdReads = true
  })
  await page.goBack({ waitUntil: 'commit' })
  await page.waitForFunction(
    () =>
      (window as unknown as { __nativeBoundary: { pop: unknown[] } })
        .__nativeBoundary.pop.length > 0,
  )
  await page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done())),
      ),
  )
  const leading = await page.evaluate(() => {
    const qa = (
      window as unknown as {
        __nativeBoundary: {
          native: unknown[]
          nextHandlers: number
          nextSources: string[]
        }
      }
    ).__nativeBoundary
    return {
      url: location.href,
      entry: history.state.__speakmateRouteEntry,
      title: document.querySelector('[data-page-title]')?.textContent,
      stack: sessionStorage.getItem('speakmate-route-stack'),
      scrolls: sessionStorage.getItem('speakmate-route-scroll-v1'),
      native: qa.native,
      nextHandlers: qa.nextHandlers,
      nextSources: qa.nextSources,
    }
  })
  await info.attach('native-leading', {
    body: JSON.stringify({ original, before, leading }, null, 2),
    contentType: 'application/json',
  })
  expect(leading.url).toBe(original.url)
  await writeFile(
    info.outputPath('native-leading.json'),
    JSON.stringify({ original, before, leading }, null, 2),
  )
  expect(leading.entry).toBe(original.state.__speakmateRouteEntry)
  expect(leading.title).toBe(noteTitle)
  expect(leading.stack).toBe(before.stack)
  const savedSource = (serialized: string | null) =>
    (JSON.parse(serialized ?? '[]') as unknown[][]).find(
      (row) => row[3] === original.state.__speakmateRouteEntry,
    )
  expect(savedSource(before.scrolls)).toEqual(savedSource(original.scrolls))
  expect(savedSource(leading.scrolls)).toEqual(savedSource(original.scrolls))
  expect(leading.native).toEqual([
    expect.objectContaining({ trusted: true, url: original.url }),
  ])
  await page.evaluate(() => {
    const qa = (
      window as unknown as {
        __nativeBoundary: { armed: boolean; pop: (() => void)[] }
      }
    ).__nativeBoundary
    qa.armed = false
    while (qa.pop.length) qa.pop.shift()!()
  })
  await page.waitForFunction(
    () =>
      (window as unknown as { __nativeBoundary: { reads: unknown[] } })
        .__nativeBoundary.reads.length > 0,
  )
  await expect(page.getByText('正在读取记录簿…', { exact: true })).toBeVisible()
  const pending = await page.evaluate(() => ({
    position: scrollY,
    entry: history.state.__speakmateRouteEntry,
    scrolls: sessionStorage.getItem('speakmate-route-scroll-v1'),
  }))
  expect(pending.entry).toBe(original.state.__speakmateRouteEntry)
  expect(pending.position).toBeLessThan(original.position)
  expect(savedSource(pending.scrolls)).toEqual(savedSource(original.scrolls))
  await page.evaluate(() => {
    const qa = (
      window as unknown as {
        __nativeBoundary: { holdReads: boolean; reads: (() => void)[] }
      }
    ).__nativeBoundary
    qa.holdReads = false
    while (qa.reads.length) qa.reads.shift()!()
  })
  await expect(link).toBeFocused()
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(original.position)
  await expect(
    page.getByRole('textbox', { name: '搜索词句与备注' }),
  ).toHaveValue('example')
  const final = await page.evaluate(() => ({
    url: location.href,
    position: scrollY,
    entry: history.state.__speakmateRouteEntry,
    focus: document.activeElement?.getAttribute('href'),
    stack: sessionStorage.getItem('speakmate-route-stack'),
  }))
  expect(final.entry).toBe(original.state.__speakmateRouteEntry)
  expect(JSON.parse(final.stack!).cursor).toBe(
    JSON.parse(original.stack!).cursor,
  )
  expect(JSON.parse(final.stack!).entries).toEqual(
    JSON.parse(before.stack!).entries,
  )
  const afterData = await localState(page)
  expect(afterData).toEqual(beforeData)
  expect(afterData.notebook).toHaveLength(9)
  await writeFile(
    info.outputPath('native-leading-complete.json'),
    JSON.stringify(
      { original, before, leading, pending, final, beforeData, afterData },
      null,
      2,
    ),
  )
  await page.screenshot({
    path: info.outputPath('native-leading-restored.png'),
  })
  await finishNetwork(info)
})
