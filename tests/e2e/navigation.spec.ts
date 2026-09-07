import { expect, test, type Page } from '@playwright/test'

const COMPLETED_SESSION_ID = 'e2e-completed-session'

async function expectSingleHeading(page: Page, name: string | RegExp) {
  const headings = page.locator('h1:visible')
  await expect(headings).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
}

async function expectActiveDestination(page: Page, name: string) {
  await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
}

async function seedCompletedSession(page: Page) {
  await page.goto('/practice')
  await expectSingleHeading(page, /今天，开口说 \d+ 分钟/)

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

test('moves through the three primary destinations without an intermediate route', async ({
  page,
}) => {
  const visited: string[] = []
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      const url = new URL(frame.url())
      visited.push(url.pathname + url.search)
    }
  })

  await page.goto('/practice')
  const practiceTitle = page.getByRole('heading', {
    level: 1,
    name: /今天，开口说 \d+ 分钟/,
  })
  await expectSingleHeading(page, /今天，开口说 \d+ 分钟/)
  await expectActiveDestination(page, '练习')

  await page.getByRole('link', { name: '场景', exact: true }).click()
  const scenesTitle = page.getByRole('heading', {
    level: 1,
    name: '把英语练进生活里',
  })
  await expectSingleHeading(page, '把英语练进生活里')
  await expect(scenesTitle).toHaveAttribute('data-page-title')
  await expect(scenesTitle).toBeFocused()
  await expectActiveDestination(page, '场景')

  await page.getByRole('link', { name: '我的', exact: true }).click()
  const meTitle = page.getByRole('heading', { level: 1, name: '我的练习' })
  await expectSingleHeading(page, '我的练习')
  await expect(meTitle).toHaveAttribute('data-page-title')
  await expect(meTitle).toBeFocused()
  await expectActiveDestination(page, '我的')

  expect(await practiceTitle.count()).toBe(0)
  expect(visited.every((route) => ['/practice', '/scenes', '/me'].includes(route))).toBe(true)
})

test('restores a filtered scene URL and scroll position after visiting daily stand-up', async ({
  page,
}) => {
  await page.goto('/scenes?category=work&level=B2')
  await expectSingleHeading(page, '把英语练进生活里')
  await expect(page.getByRole('button', { name: '职场' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  const card = page.getByRole('link', { name: '准备练习：每日站会' })
  await card.scrollIntoViewIfNeeded()
  const previousScroll = await page.evaluate(() => window.scrollY)
  expect(previousScroll).toBeGreaterThan(0)
  await card.click()

  await expect(page).toHaveURL(
    /\/scenes\/daily-standup\?level=B2&from=%2Fscenes%3Fcategory%3Dwork%26level%3DB2$/,
  )
  await expectSingleHeading(page, '每日站会')
  await page.getByRole('link', { name: '返回每日站会' }).click()

  await expect(page).toHaveURL(/\/scenes\?category=work&level=B2$/)
  await expectActiveDestination(page, '场景')
  await expect(page.getByRole('button', { name: '职场' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThanOrEqual(Math.max(1, previousScroll - 2))
})

for (const route of [
  { path: '/privacy', heading: '隐私与数据', back: '返回隐私与数据' },
  { path: '/install', heading: '安装到手机', back: '返回安装到手机' },
]) {
  test(`${route.path} direct deep link uses /me as its safe fallback`, async ({
    page,
  }) => {
    await page.goto(route.path)
    await expectSingleHeading(page, route.heading)
    await page.getByRole('link', { name: route.back }).click()

    await expect(page).toHaveURL(/\/me$/)
    await expectSingleHeading(page, '我的练习')
    await expectActiveDestination(page, '我的')
  })
}

test('a new session supports guarded and clean exits without an incorrect URL', async ({
  page,
}) => {
  await page.goto('/session/new?scene=hotel-check-in&level=B1')
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await expectSingleHeading(page, 'Dialogue Stage')

  await page.getByRole('button', { name: '改用键盘输入' }).click()
  await page.getByLabel('英文内容').fill('Hello, I have a reservation.')
  await expect(page.locator('html')).toHaveAttribute(
    'data-interaction-busy',
    'true',
  )
  await page.getByRole('link', { name: '退出本次练习' }).click()

  await expect(page).toHaveURL(
    /\/session\/new\?scene=hotel-check-in&level=B1$/,
  )
  const dialog = page.getByRole('alertdialog', { name: '退出本次练习？' })
  await expect(dialog).toBeVisible()
  await page.getByRole('button', { name: '继续练习' }).click()
  await expect(page.getByLabel('英文内容')).toHaveValue(
    'Hello, I have a reservation.',
  )

  await page.getByRole('button', { name: '取消' }).click()
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-interaction-busy',
  )
  await page.getByRole('link', { name: '退出本次练习' }).click()

  await expect(dialog).toHaveCount(0)
  await expect(page).toHaveURL(/\/scenes\/hotel-check-in\?level=B1$/)
  await expectSingleHeading(page, '酒店入住')
})

test('a completed report exits explicitly to practice and scenes', async ({
  page,
}) => {
  await seedCompletedSession(page)
  const reportUrl = `/session/${COMPLETED_SESSION_ID}/report`

  await page.goto(reportUrl)
  await expectSingleHeading(page, '本次复盘')
  await page.getByRole('link', { name: '回到今日练习' }).click()
  await expect(page).toHaveURL(/\/practice$/)
  await expectSingleHeading(page, /今天，开口说 \d+ 分钟/)
  await expectActiveDestination(page, '练习')

  await page.goto(reportUrl)
  await expectSingleHeading(page, '本次复盘')
  await page.getByRole('link', { name: '换个场景' }).click()
  await expect(page).toHaveURL(/\/scenes$/)
  await expectSingleHeading(page, '把英语练进生活里')
  await expectActiveDestination(page, '场景')
})
