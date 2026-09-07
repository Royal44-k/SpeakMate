import { expect, test, type Locator, type Page } from '@playwright/test'

const COMPLETED_SESSION_ID = 'e2e-responsive-report'
const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
]

const routes = [
  { path: '/practice', heading: /今天，开口说 \d+ 分钟/ },
  { path: '/scenes', heading: '把英语练进生活里' },
  { path: '/scenes/daily-standup?level=B2', heading: '每日站会' },
  {
    path: '/session/new?scene=hotel-check-in&level=B1',
    heading: 'Dialogue Stage',
  },
  { path: '/me', heading: '我的练习' },
  { path: '/privacy', heading: '隐私与数据' },
  { path: '/install', heading: '安装到手机' },
  {
    path: `/session/${COMPLETED_SESSION_ID}/report`,
    heading: '本次复盘',
  },
] as const

async function seedCompletedSession(page: Page) {
  await page.goto('/practice')
  await expect(
    page.getByRole('heading', { level: 1, name: /今天，开口说 \d+ 分钟/ }),
  ).toBeVisible()
  await page.evaluate(async (sessionId) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('speakmate-v1', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const now = '2026-09-05T08:00:00.000Z'
    const transaction = database.transaction('sessions', 'readwrite')
    transaction.objectStore('sessions').put({
      id: sessionId,
      profileId: 'guest-e2e',
      sceneId: 'travel-05',
      sceneVersion: 1,
      level: 'B1',
      status: 'completed',
      startedAt: now,
      updatedAt: now,
      completedAt: now,
      completedGoals: [
        'hotel-check-in-goal-1',
        'hotel-check-in-goal-2',
        'hotel-check-in-goal-3',
      ],
    })
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
    database.close()
  }, COMPLETED_SESSION_ID)
}

async function expectRouteReady(
  page: Page,
  route: (typeof routes)[number],
) {
  await page.goto(route.path)
  if (route.path.startsWith('/session/new')) {
    await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  }
  await expect(
    page.getByRole('heading', { level: 1, name: route.heading }),
  ).toBeVisible()
  await expect(page.locator('h1:visible')).toHaveCount(1)
}

async function auditTouchGeometry(page: Page) {
  return page
    .locator('button, nav a, [data-touch-target]')
    .evaluateAll((nodes) => {
      const visible = nodes
        .filter((node): node is HTMLElement => node instanceof HTMLElement)
        .filter((node) => {
          const style = getComputedStyle(node)
          const rect = node.getBoundingClientRect()
          return (
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            rect.width > 0 &&
            rect.height > 0
          )
        })
        .map((node) => ({
          node,
          text: node.getAttribute('aria-label') ?? node.textContent?.trim(),
          rect: node.getBoundingClientRect(),
        }))
      const undersized = visible
        .filter(({ rect }) => rect.width < 44 || rect.height < 44)
        .map(({ text, rect }) => ({
          text,
          rect: rect.toJSON(),
        }))
      const crowded: Array<{
        first: string | undefined
        second: string | undefined
        distance: number
      }> = []

      for (let firstIndex = 0; firstIndex < visible.length; firstIndex += 1) {
        for (
          let secondIndex = firstIndex + 1;
          secondIndex < visible.length;
          secondIndex += 1
        ) {
          const first = visible[firstIndex]
          const second = visible[secondIndex]
          if (
            first.node.parentElement !== second.node.parentElement ||
            first.node.contains(second.node) ||
            second.node.contains(first.node)
          ) {
            continue
          }
          const horizontalGap = Math.max(
            0,
            first.rect.left - second.rect.right,
            second.rect.left - first.rect.right,
          )
          const verticalGap = Math.max(
            0,
            first.rect.top - second.rect.bottom,
            second.rect.top - first.rect.bottom,
          )
          const distance = Math.hypot(horizontalGap, verticalGap)
          if (distance < 8) {
            crowded.push({
              first: first.text,
              second: second.text,
              distance,
            })
          }
        }
      }

      return { undersized, crowded }
    })
}

for (const viewport of viewports) {
  test(`all representative routes fit and preserve touch geometry at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await page.setViewportSize(viewport)
    await seedCompletedSession(page)

    for (const route of routes) {
      await expectRouteReady(page, route)
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      )
      expect(
        overflow,
        `${route.path} at ${viewport.width}x${viewport.height}`,
      ).toBeLessThanOrEqual(1)

      const geometry = await auditTouchGeometry(page)
      expect(
        geometry.undersized,
        `undersized targets on ${route.path} at ${viewport.width}x${viewport.height}`,
      ).toEqual([])
      expect(
        geometry.crowded,
        `crowded targets on ${route.path} at ${viewport.width}x${viewport.height}`,
      ).toEqual([])
    }
  })
}

test('bottom navigation consumes the shared navigation layer token', async ({
  page,
}) => {
  await page.goto('/scenes')
  const navigation = page.getByRole('navigation', { name: '主要导航' })
  await expect(navigation).toBeVisible()

  const zIndex = await navigation.evaluate((node) => {
    document.documentElement.style.setProperty('--z-navigation', '123')
    return getComputedStyle(node).zIndex
  })

  expect(zIndex).toBe('123')
})

async function expectControlInFront(
  page: Page,
  control: Locator,
  viewport: { width: number; height: number },
) {
  await control.scrollIntoViewIfNeeded()
  const box = await control.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x + box!.width).toBeGreaterThan(0)
  expect(box!.x).toBeLessThan(viewport.width)
  expect(box!.y + box!.height).toBeGreaterThan(0)
  expect(box!.y).toBeLessThan(viewport.height)

  const ownsCenterPoint = await control.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const centerX = Math.max(
      0,
      Math.min(innerWidth - 1, rect.left + rect.width / 2),
    )
    const centerY = Math.max(
      0,
      Math.min(innerHeight - 1, rect.top + rect.height / 2),
    )
    const front = document.elementFromPoint(centerX, centerY)
    return front === element || element.contains(front)
  })
  expect(ownsCenterPoint).toBe(true)
}

test('phone landscape keeps both keyboard actions above fixed layers at 200 percent text', async ({
  page,
}) => {
  const viewport = { width: 844, height: 390 }
  await page.setViewportSize(viewport)
  await page.goto('/session/new?scene=hotel-check-in&level=B1')
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await page.getByRole('button', { name: '改用键盘输入' }).click()

  await expectControlInFront(page, page.getByLabel('英文内容'), viewport)
  await expectControlInFront(
    page,
    page.getByRole('button', { name: '提交这一轮' }),
    viewport,
  )
})
