# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-settlement-browser.spec.ts >> E: UI-earned points, same/different reward races and actual 100/200/300 applications
- Location: tests\e2e\task7-settlement-browser.spec.ts:575:1

# Error details

```
Error: page.goto: net::ERR_ABORTED at http://127.0.0.1:3132/
Call log:
  - navigating to "http://127.0.0.1:3132/", waiting until "load"

```

# Test source

```ts
  589 |   expect(
  590 |     hundred.learningEvents.filter((row) => row.type === 'warmup-completed'),
  591 |   ).toHaveLength(10)
  592 |   const backup = await download(page, info, 'ui-earned-hundred')
  593 | 
  594 |   for (const same of [true, false]) {
  595 |     const race = await browser.newContext({
  596 |       baseURL,
  597 |       locale: 'zh-CN',
  598 |       timezoneId: 'Asia/Shanghai',
  599 |       viewport: { width: 390, height: 844 },
  600 |       isMobile: true,
  601 |       hasTouch: true,
  602 |     })
  603 |     try {
  604 |       const a = await race.newPage()
  605 |       const raceAudit = await protect(race, baseURL!)
  606 |       await a.clock.setFixedTime(new Date('2026-07-10T02:00:00Z'))
  607 |       await restore(a, backup.text)
  608 |       const b = await race.newPage()
  609 |       await b.clock.setFixedTime(new Date('2026-07-10T02:00:00Z'))
  610 |       await Promise.all([a.goto('/rewards'), b.goto('/rewards')])
  611 |       await chooseReward(a, '深海个人卡', 100)
  612 |       await chooseReward(b, same ? '深海个人卡' : '纸页个人卡', 100)
  613 |       await Promise.all([
  614 |         a.getByRole('button', { name: '确认兑换', exact: true }).click(),
  615 |         b.getByRole('button', { name: '确认兑换', exact: true }).click(),
  616 |       ])
  617 |       await expect
  618 |         .poll(async () => (await state(a)).rewardUnlocks.length)
  619 |         .toBe(1)
  620 |       const result = await state(a)
  621 |       expect(points(result)).toBe(0)
  622 |       expect(earned(result)).toBe(100)
  623 |       expect(result.pointsLedger.filter((row) => row.delta < 0)).toHaveLength(1)
  624 |       if (same) {
  625 |         await expect
  626 |           .poll(
  627 |             async () =>
  628 |               `${await a.locator('main').innerText()} ${await b.locator('main').innerText()}`,
  629 |           )
  630 |           .toContain('没有重复扣分')
  631 |       } else {
  632 |         await expect
  633 |           .poll(
  634 |             async () =>
  635 |               `${await a.locator('main').innerText()} ${await b.locator('main').innerText()}`,
  636 |           )
  637 |           .toContain('余额不足')
  638 |       }
  639 |       await writeFile(
  640 |         info.outputPath(`reward-${same ? 'same' : 'different'}-race.json`),
  641 |         JSON.stringify(result, null, 2),
  642 |       )
  643 |       await raceAudit(info, `reward-${same ? 'same' : 'different'}`)
  644 |     } finally {
  645 |       await race.close()
  646 |     }
  647 |   }
  648 | 
  649 |   await page.goto('/me')
  650 |   const profileBefore = await page
  651 |     .locator('main header')
  652 |     .first()
  653 |     .evaluate((el) => getComputedStyle(el).backgroundColor)
  654 |   await page.goto('/rewards')
  655 |   await chooseReward(page, '深海个人卡', 100)
  656 |   await page.getByRole('button', { name: '确认兑换', exact: true }).click()
  657 |   await page
  658 |     .getByRole('article', { name: '深海个人卡' })
  659 |     .getByRole('button', { name: '应用', exact: true })
  660 |     .click()
  661 |   await expect(page.getByText('已应用，下次打开对应页面仍保留。')).toBeVisible()
  662 |   await page.goto('/me')
  663 |   const profile = page.locator('[data-profile-style="profile-atlantic"]')
  664 |   await expect(profile).toBeVisible()
  665 |   expect(
  666 |     await profile.evaluate((el) => getComputedStyle(el).backgroundColor),
  667 |   ).not.toBe(profileBefore)
  668 |   await page.reload()
  669 |   await expect(
  670 |     page.locator('[data-profile-style="profile-atlantic"]'),
  671 |   ).toBeVisible()
  672 |   await expect(page.getByText('示例数据，非真实好友排名')).toBeVisible()
  673 |   await page.screenshot({ path: info.outputPath('applied-profile.png') })
  674 | 
  675 |   await earnWarmups(page, 10, 20)
  676 |   expect(points(await state(page))).toBe(200)
  677 |   await page.goto('/')
  678 |   const coverBefore = await page
  679 |     .locator('main > header')
  680 |     .evaluate((el) => getComputedStyle(el).backgroundColor)
  681 |   await page.goto('/rewards')
  682 |   await chooseReward(page, '海平线目标封面', 200)
  683 |   await page.getByRole('button', { name: '确认兑换', exact: true }).click()
  684 |   await page
  685 |     .getByRole('article', { name: '海平线目标封面' })
  686 |     .getByRole('button', { name: '应用', exact: true })
  687 |     .click()
  688 |   await expect(page.getByText('已应用，下次打开对应页面仍保留。')).toBeVisible()
> 689 |   await page.goto('/')
      |              ^ Error: page.goto: net::ERR_ABORTED at http://127.0.0.1:3132/
  690 |   await expect(page.locator('[data-cover="cover-horizon"]')).toBeVisible()
  691 |   expect(
  692 |     await page
  693 |       .locator('[data-cover="cover-horizon"]')
  694 |       .evaluate((el) => getComputedStyle(el).backgroundColor),
  695 |   ).not.toBe(coverBefore)
  696 |   await page.reload()
  697 |   await expect(page.locator('[data-cover="cover-horizon"]')).toBeVisible()
  698 |   await page.screenshot({ path: info.outputPath('applied-cover.png') })
  699 | 
  700 |   await earnWarmups(page, 30, 30)
  701 |   expect(points(await state(page))).toBe(300)
  702 |   await page.goto('/rewards')
  703 |   await chooseReward(page, '把话问清楚', 300)
  704 |   await page.getByRole('button', { name: '确认兑换', exact: true }).click()
  705 |   await page
  706 |     .getByRole('article', { name: '把话问清楚' })
  707 |     .getByRole('button', { name: '阅读练习资料' })
  708 |     .click()
  709 |   const sheet = page.getByRole('region', { name: '把话问清楚' })
  710 |   await expect(
  711 |     sheet.getByText('Could you say that again, please?', { exact: true }),
  712 |   ).toBeVisible()
  713 |   expect((await sheet.innerText()).length).toBeGreaterThan(400)
  714 |   const final = await state(page)
  715 |   expect(earned(final)).toBe(600)
  716 |   expect(points(final)).toBe(0)
  717 |   expect(final.rewardUnlocks).toHaveLength(3)
  718 |   await page.reload()
  719 |   await page
  720 |     .getByRole('article', { name: '把话问清楚' })
  721 |     .getByRole('button', { name: '阅读练习资料' })
  722 |     .click()
  723 |   expect(points(await state(page))).toBe(0)
  724 |   const exported = await download(page, info, 'earned-and-applied-rewards')
  725 |   expect(exported.text).not.toContain('示例学习者')
  726 |   await audit(info, 'reward-complete')
  727 | })
  728 | 
```