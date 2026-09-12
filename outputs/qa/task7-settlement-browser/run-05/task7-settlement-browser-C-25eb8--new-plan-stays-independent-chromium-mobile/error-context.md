# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-settlement-browser.spec.ts >> C: two old plans complete after midnight, foreground splits and new plan stays independent
- Location: tests\e2e\task7-settlement-browser.spec.ts:245:1

# Error details

```
TypeError: Cannot read properties of undefined (reading 'tasks')
```

# Test source

```ts
  202 |     expect(raced.pointsLedger).toHaveLength(4)
  203 |     await writeFile(info.outputPath('same-finish-race.json'), JSON.stringify(raced, null, 2))
  204 |     await raceAudit(info, 'same-finish')
  205 |   } finally { await race.close() }
  206 |   await audit(info, 'failure-retry')
  207 | })
  208 | 
  209 | // Catches a losing finish/stop operation overwriting the transaction winner.
  210 | test('B: finish and stop from two live windows preserve one terminal result', async ({ page, context, baseURL }, info) => {
  211 |   test.setTimeout(120000)
  212 |   const audit = await protect(context, baseURL!)
  213 |   await page.clock.setFixedTime(new Date(anchor))
  214 |   const url = await finalTaskCheckpoint(page)
  215 |   const b = await context.newPage()
  216 |   await b.clock.setFixedTime(new Date(anchor))
  217 |   await b.goto(url)
  218 |   await expect(b.getByRole('button', { name: '停止本次练习' })).toBeVisible()
  219 |   await Promise.all([page.getByRole('button', { name: finishLabel }).click(), b.getByRole('button', { name: '停止本次练习' }).click()])
  220 |   const id = new URL(url).searchParams.get('id')!
  221 |   await expect.poll(async () => (await state(page)).sessions.find(row => row.id === id)!.status).not.toBe('active')
  222 |   const result = await state(page)
  223 |   const winner = result.sessions.find(row => row.id === id)!.status
  224 |   expect(['completed', 'abandoned']).toContain(winner)
  225 |   expect(points(result)).toBe(winner === 'completed' ? 35 : 20)
  226 |   const losing = winner === 'completed' ? b : page
  227 |   await expect(losing.getByRole('alert').filter({ hasText: /已在别处变化|不支持这次操作/ })).toBeVisible()
  228 |   await page.reload()
  229 |   expect((await state(page)).sessions.find(row => row.id === id)!.status).toBe(winner)
  230 |   expect(points(await state(page))).toBe(points(result))
  231 |   await writeFile(info.outputPath('finish-stop-race.json'), JSON.stringify(result, null, 2))
  232 |   await audit(info, 'finish-stop')
  233 | })
  234 | 
  235 | async function earnWarmups(page: Page, firstDay: number, days: number) {
  236 |   for (let day = firstDay; day < firstDay + days; day++) {
  237 |     await page.clock.setFixedTime(new Date(Date.UTC(2026, 6, 1 + day, 2)))
  238 |     await page.goto('/')
  239 |     await warmup(page)
  240 |   }
  241 | }
  242 | 
  243 | // Catches wrong award/check-in dates, midnight misallocation and background accrual.
  244 | // Visibility is a controlled browser-document signal, not an OS app-switch claim.
  245 | test('C: two old plans complete after midnight, foreground splits and new plan stays independent', async ({ page, context, baseURL }, info) => {
  246 |   test.setTimeout(120000)
  247 |   const audit = await protect(context, baseURL!)
  248 |   await page.clock.install({ time: new Date('2026-09-09T02:00:00Z') })
  249 |   await onboard(page)
  250 |   await page.getByRole('button', { name: '准备表达热身' }).click()
  251 |   await page.getByRole('button', { name: '隐藏参考，开始回忆' }).click()
  252 |   await expect(page.getByRole('textbox', { name: '我的回忆', exact: true })).toBeVisible()
  253 |   await page.goto('/privacy')
  254 |   await page.clock.pauseAt(new Date('2026-09-10T15:58:00Z'))
  255 |   await page.goto('/')
  256 |   await page.getByRole('button', { name: '开始场景应用' }).click()
  257 |   await expect(page.getByRole('heading', { name: 'Dialogue Stage' })).toBeVisible()
  258 |   const id = new URL(page.url()).searchParams.get('id')!
  259 |   expect(id).not.toBe('new')
  260 |   const initial = await state(page)
  261 |   const task = initial.dailyPlans.find(plan => plan.dateKey === '2026-09-10')!.tasks.find(row => row.slot === 'scene')!
  262 |   const originalSnapshot = initial.dailyPlans.find(plan => plan.dateKey === '2026-09-10')!.snapshot
  263 |   const duration = async () => (await state(page)).learningEvents.reduce((sum, event) => sum + (event.type === 'foreground-time-recorded' && event.runId.startsWith(`${id}_`) ? event.durationMs : 0), 0)
  264 |   await page.clock.runFor(30000)
  265 |   await expect.poll(duration).toBe(30000)
  266 |   await page.evaluate(() => {
  267 |     const visibility = { value: 'hidden' }
  268 |     Object.assign(window, { __qaVisibility: visibility })
  269 |     Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility.value })
  270 |     document.dispatchEvent(new Event('visibilitychange'))
  271 |   })
  272 |   await page.clock.fastForward(60000)
  273 |   expect(await duration()).toBe(30000)
  274 |   await page.evaluate(() => {
  275 |     (window as unknown as { __qaVisibility: { value: string } }).__qaVisibility.value = 'visible'
  276 |     document.dispatchEvent(new Event('visibilitychange'))
  277 |   })
  278 |   await page.clock.fastForward(210000)
  279 |   await expect.poll(duration).toBe(240000)
  280 |   const foreground = (await state(page)).learningEvents.filter(event => event.type === 'foreground-time-recorded' && event.runId.startsWith(`${id}_`))
  281 |   const totals: Record<string, number> = {}
  282 |   for (const event of foreground) if (event.type === 'foreground-time-recorded') totals[event.dateKey] = (totals[event.dateKey] ?? 0) + event.durationMs
  283 |   expect(totals).toEqual({ '2026-09-10': 60000, '2026-09-11': 180000 })
  284 |   expect(await page.evaluate(() => new Date().toISOString())).toBe('2026-09-10T16:03:00.000Z')
  285 |   await reachTerminal(page)
  286 |   await finish(page)
  287 |   const completed = await state(page)
  288 |   expect(points(completed)).toBe(10)
  289 |   const event = completed.learningEvents.find(row => row.type === 'session-completed' && row.sessionId === id)!
  290 |   expect(event.dateKey).toBe('2026-09-11')
  291 |   expect(event.provenance).toMatchObject({ planDate: '2026-09-10', sourceTaskId: task.id })
  292 |   expect(completed.dailyPlans.find(plan => plan.dateKey === '2026-09-10')!.snapshot).toEqual(originalSnapshot)
  293 |   await page.goto('/?date=2026-09-09&task=warmup')
  294 |   await warmup(page)
  295 |   expect(points(await state(page))).toBe(20)
  296 |   const twoOld = (await state(page)).learningEvents.filter(row => row.type === 'session-completed' || row.type === 'warmup-completed')
  297 |   expect(twoOld).toHaveLength(2)
  298 |   expect(twoOld.every(row => row.dateKey === '2026-09-11')).toBe(true)
  299 |   expect(twoOld.map(row => row.provenance?.planDate).sort()).toEqual(['2026-09-09', '2026-09-10'])
  300 |   await page.goto('/')
  301 |   const today = (await state(page)).dailyPlans.find(plan => plan.dateKey === '2026-09-11')!
> 302 |   expect(today.tasks.every(row => row.status === 'not-started')).toBe(true)
      |                ^ TypeError: Cannot read properties of undefined (reading 'tasks')
  303 |   await page.reload()
  304 |   expect((await state(page)).dailyPlans.find(plan => plan.id === today.id)).toEqual(today)
  305 |   await page.goto('/scenes')
  306 |   await page.getByRole('button', { name: 'B2', exact: true }).click()
  307 |   await expect.poll(async () => (await state(page)).profile[0].level).toBe('B2')
  308 |   await page.goto('/')
  309 |   await expect(page.getByText(/今日任务等级 A2/)).toBeVisible()
  310 |   await expect(page.getByText(/当前个人等级 B2/)).toBeVisible()
  311 |   await page.goto('/practice')
  312 |   await expect(page.getByRole('combobox', { name: '当前练习水平' })).toHaveValue('B2')
  313 |   await expect(page.getByRole('link', { name: '准备开始' })).toHaveAttribute('href', /[?&]level=B2(?:&|$)/)
  314 |   const final = await state(page)
  315 |   expect(final.sessions.find(row => row.id === id)!.level).toBe('A2')
  316 |   expect(final.dailyPlans.find(plan => plan.id === today.id)!.snapshot.level).toBe('A2')
  317 |   expect(points(final)).toBe(20)
  318 |   await writeFile(info.outputPath('crossday-state.json'), JSON.stringify({ foreground, totals, final, visibilityMethod: 'document signal injection; no OS app switching' }, null, 2))
  319 |   await audit(info, 'crossday')
  320 | })
  321 | 
  322 | async function chooseReward(page: Page, title: string, price: number) {
  323 |   await page.getByRole('article', { name: title, exact: true }).getByRole('button', { name: `兑换 · ${price} 积分` }).click()
  324 |   await expect(page.getByRole('region', { name: '确认兑换' })).toBeVisible()
  325 | }
  326 | 
  327 | // Catches double spending, fake successful application and blank digital rewards.
  328 | test('E: UI-earned points, same/different reward races and actual 100/200/300 applications', async ({ page, context, browser, baseURL }, info) => {
  329 |   test.setTimeout(300000)
  330 |   const audit = await protect(context, baseURL!)
  331 |   await page.clock.setFixedTime(new Date('2026-07-01T02:00:00Z'))
  332 |   await onboard(page)
  333 |   await earnWarmups(page, 0, 10)
  334 |   const hundred = await state(page)
  335 |   expect(points(hundred)).toBe(100)
  336 |   expect(earned(hundred)).toBe(100)
  337 |   expect(hundred.learningEvents.filter(row => row.type === 'warmup-completed')).toHaveLength(10)
  338 |   const backup = await download(page, info, 'ui-earned-hundred')
  339 | 
  340 |   for (const same of [true, false]) {
  341 |     const race = await browser.newContext({ baseURL, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' })
  342 |     try {
  343 |       const a = await race.newPage()
  344 |       const raceAudit = await protect(race, baseURL!)
  345 |       await a.clock.setFixedTime(new Date('2026-07-10T02:00:00Z'))
  346 |       await restore(a, backup.text)
  347 |       const b = await race.newPage()
  348 |       await b.clock.setFixedTime(new Date('2026-07-10T02:00:00Z'))
  349 |       await Promise.all([a.goto('/rewards'), b.goto('/rewards')])
  350 |       await chooseReward(a, '深海个人卡', 100)
  351 |       await chooseReward(b, same ? '深海个人卡' : '纸页个人卡', 100)
  352 |       await Promise.all([a.getByRole('button', { name: '确认兑换', exact: true }).click(), b.getByRole('button', { name: '确认兑换', exact: true }).click()])
  353 |       await expect.poll(async () => (await state(a)).rewardUnlocks.length).toBe(1)
  354 |       const result = await state(a)
  355 |       expect(points(result)).toBe(0)
  356 |       expect(earned(result)).toBe(100)
  357 |       expect(result.pointsLedger.filter(row => row.delta < 0)).toHaveLength(1)
  358 |       if (same) {
  359 |         await expect.poll(async () => `${await a.locator('main').innerText()} ${await b.locator('main').innerText()}`).toContain('没有重复扣分')
  360 |       } else {
  361 |         await expect.poll(async () => `${await a.locator('main').innerText()} ${await b.locator('main').innerText()}`).toContain('余额不足')
  362 |       }
  363 |       await writeFile(info.outputPath(`reward-${same ? 'same' : 'different'}-race.json`), JSON.stringify(result, null, 2))
  364 |       await raceAudit(info, `reward-${same ? 'same' : 'different'}`)
  365 |     } finally { await race.close() }
  366 |   }
  367 | 
  368 |   await page.goto('/me')
  369 |   const profileBefore = await page.locator('main header').first().evaluate(el => getComputedStyle(el).backgroundColor)
  370 |   await page.goto('/rewards')
  371 |   await chooseReward(page, '深海个人卡', 100)
  372 |   await page.getByRole('button', { name: '确认兑换', exact: true }).click()
  373 |   await page.getByRole('article', { name: '深海个人卡' }).getByRole('button', { name: '应用', exact: true }).click()
  374 |   await expect(page.getByText('已应用，下次打开对应页面仍保留。')).toBeVisible()
  375 |   await page.goto('/me')
  376 |   const profile = page.locator('[data-profile-style="profile-atlantic"]')
  377 |   await expect(profile).toBeVisible()
  378 |   expect(await profile.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(profileBefore)
  379 |   await page.reload()
  380 |   await expect(page.locator('[data-profile-style="profile-atlantic"]')).toBeVisible()
  381 |   await expect(page.getByText('示例数据，非真实好友排名')).toBeVisible()
  382 |   await page.screenshot({ path: info.outputPath('applied-profile.png') })
  383 | 
  384 |   await earnWarmups(page, 10, 20)
  385 |   expect(points(await state(page))).toBe(200)
  386 |   await page.goto('/')
  387 |   const coverBefore = await page.locator('main > header').evaluate(el => getComputedStyle(el).backgroundColor)
  388 |   await page.goto('/rewards')
  389 |   await chooseReward(page, '海平线目标封面', 200)
  390 |   await page.getByRole('button', { name: '确认兑换', exact: true }).click()
  391 |   await page.getByRole('article', { name: '海平线目标封面' }).getByRole('button', { name: '应用', exact: true }).click()
  392 |   await expect(page.getByText('已应用，下次打开对应页面仍保留。')).toBeVisible()
  393 |   await page.goto('/')
  394 |   await expect(page.locator('[data-cover="cover-horizon"]')).toBeVisible()
  395 |   expect(await page.locator('[data-cover="cover-horizon"]').evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(coverBefore)
  396 |   await page.reload()
  397 |   await expect(page.locator('[data-cover="cover-horizon"]')).toBeVisible()
  398 |   await page.screenshot({ path: info.outputPath('applied-cover.png') })
  399 | 
  400 |   await earnWarmups(page, 30, 30)
  401 |   expect(points(await state(page))).toBe(300)
  402 |   await page.goto('/rewards')
```