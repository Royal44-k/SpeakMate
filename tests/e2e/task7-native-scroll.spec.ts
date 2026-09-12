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
      !!document.querySelector('article') ||
      (window as unknown as { __heldNotebook?: unknown[] }).__heldNotebook
        ?.length,
  )
  const delayed = await page.evaluate(
    () =>
      !!(window as unknown as { __heldNotebook?: unknown[] }).__heldNotebook
        ?.length,
  )
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
