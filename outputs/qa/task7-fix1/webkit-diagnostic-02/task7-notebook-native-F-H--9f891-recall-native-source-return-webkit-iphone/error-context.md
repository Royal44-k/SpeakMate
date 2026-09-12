# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-notebook-native.spec.ts >> F/H: canonical two-source note, source A2 vs current B2, five-question real simulation and phase-owned stale recall; native source return
- Location: tests\e2e\task7-notebook-native.spec.ts:12:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('link', { name: '查看词句' })
Expected: focused
Received: inactive
Timeout:  8000ms

Call log:
  - Expect "toBeFocused" with timeout 8000ms
  - waiting for getByRole('link', { name: '查看词句' })
    19 × locator resolved to <a href="/notebook/note?id=41e5856f-81f1-4f0c-b0ab-e5bd52fa2ecb">查看词句</a>
       - unexpected value "inactive"

```

```yaml
- link "查看词句":
  - /url: /notebook/note?id=41e5856f-81f1-4f0c-b0ab-e5bd52fa2ecb
```

# Test source

```ts
  113 |   await page.getByRole('button', { name: '读取最新进度' }).click()
  114 |   await expect(page.getByText(/这份输入仍保留为原来的回忆草稿/)).toBeVisible()
  115 |   await expect(oldDraft).toHaveValue('My original recall remains mine.')
  116 |   await expect(
  117 |     page.getByRole('button', { name: '保存回忆并查看' }),
  118 |   ).toBeDisabled()
  119 |   await page.getByRole('link', { name: '退出本次练习' }).click()
  120 |   await page.getByRole('button', { name: '继续练习', exact: true }).click()
  121 |   expect(page.url()).toBe(simulationUrl)
  122 |   await expect(oldDraft).toHaveValue('My original recall remains mine.')
  123 |   await page.getByRole('button', { name: '取消本次输入' }).click()
  124 |   await expect(
  125 |     page.getByRole('textbox', { name: '我的替换或造句' }),
  126 |   ).toHaveValue('')
  127 |   await other.close()
  128 |   await page
  129 |     .getByRole('textbox', { name: '我的替换或造句' })
  130 |     .fill('For example, we can describe a friend.')
  131 |   await page.getByRole('button', { name: '保存造句并应用' }).click()
  132 |   await expect(
  133 |     page.getByRole('region', { name: '当前问题', exact: true }),
  134 |   ).toBeVisible()
  135 |   await page.reload()
  136 |   const actualAnswers: string[] = []
  137 |   for (let n = 0; n < 5; n++) actualAnswers.push(await answer(page))
  138 |   await expect(
  139 |     page.getByRole('button', { name: '确认结束并保存复盘' }),
  140 |   ).toBeVisible()
  141 |   await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
  142 |   await expect(
  143 |     page.getByRole('heading', { name: '这轮已保存。' }),
  144 |   ).toBeVisible()
  145 |   state = await localState(page)
  146 |   simulation = state.sessions.find((session) => session.id === id)!
  147 |   expect(simulation.status).toBe('completed')
  148 |   expect(simulation.simulation!.recall!.text).toBe('For example, a park.')
  149 |   expect(simulation.simulation!.composition!.text).toBe(
  150 |     'For example, we can describe a friend.',
  151 |   )
  152 |   expect(state.turns.filter((turn) => turn.sessionId === id)).toHaveLength(5)
  153 |   expect(state.pointsLedger).toEqual([])
  154 |   await page.getByRole('link', { name: '查看本次复盘' }).click()
  155 |   const reportUrl = page.url()
  156 |   navigationSnapshots.push(await navigationSnapshot())
  157 |   const listReturn = page.getByRole('link', { name: '返回记录簿', exact: true })
  158 |   await listReturn.scrollIntoViewIfNeeded()
  159 |   await listReturn.focus()
  160 |   await expect(listReturn).toBeFocused()
  161 |   const reportAppearance = await listReturn.evaluate((link) => {
  162 |     const rect = link.getBoundingClientRect()
  163 |     const section = link.closest('section')!
  164 |     const heading = section.querySelector('h2')!
  165 |     return {
  166 |       width: rect.width,
  167 |       height: rect.height,
  168 |       top: rect.top,
  169 |       bottom: rect.bottom,
  170 |       viewportHeight: innerHeight,
  171 |       linkColor: getComputedStyle(link).color,
  172 |       headingColor: getComputedStyle(heading).color,
  173 |       background: getComputedStyle(section.closest('header')!).backgroundColor,
  174 |       outline: getComputedStyle(link).outlineStyle,
  175 |     }
  176 |   })
  177 |   expect(reportAppearance.height).toBeGreaterThanOrEqual(44)
  178 |   expect(reportAppearance.width).toBeGreaterThanOrEqual(44)
  179 |   expect(reportAppearance.top).toBeGreaterThanOrEqual(0)
  180 |   expect(reportAppearance.bottom).toBeLessThanOrEqual(
  181 |     reportAppearance.viewportHeight,
  182 |   )
  183 |   expect(reportAppearance.linkColor).toBe('rgb(255, 255, 255)')
  184 |   expect(reportAppearance.headingColor).toBe(reportAppearance.linkColor)
  185 |   expect(reportAppearance.outline).toBe('solid')
  186 |   const luminance = (color: string) =>
  187 |     color
  188 |       .match(/\d+/g)!
  189 |       .slice(0, 3)
  190 |       .map(Number)
  191 |       .map((part) => part / 255)
  192 |       .map((part) =>
  193 |         part <= 0.04045 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4,
  194 |       )
  195 |       .reduce(
  196 |         (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
  197 |         0,
  198 |       )
  199 |   const contrast =
  200 |     (luminance(reportAppearance.linkColor) + 0.05) /
  201 |     (luminance(reportAppearance.background) + 0.05)
  202 |   expect(contrast).toBeGreaterThanOrEqual(4.5)
  203 |   await page.screenshot({ path: info.outputPath('report-direct-return.png') })
  204 |   await expect(
  205 |     page.getByRole('link', { name: '返回词句或记录簿' }).last(),
  206 |   ).toHaveAttribute('href', new URL(noteUrl).pathname + new URL(noteUrl).search)
  207 |   await page.getByRole('link', { name: '返回记录簿', exact: true }).click()
  208 |   await expect(
  209 |     page.getByRole('textbox', { name: '搜索词句与备注' }),
  210 |   ).toHaveValue('for example')
  211 |   navigationSnapshots.push(await navigationSnapshot())
  212 |   await writeFile(info.outputPath('navigation-stages.json'), JSON.stringify(navigationSnapshots, null, 2))
> 213 |   await expect(listLink).toBeFocused()
      |                          ^ Error: expect(locator).toBeFocused() failed
  214 |   expect(
  215 |     Math.abs((await page.evaluate(() => scrollY)) - listPosition),
  216 |   ).toBeLessThan(3)
  217 |   const returnedUrl = page.url()
  218 |   await page.goBack()
  219 |   const backUrl = page.url()
  220 |   await info.attach('actual-back-url', {
  221 |     body: JSON.stringify({ reportUrl, returnedUrl, backUrl }),
  222 |     contentType: 'application/json',
  223 |   })
  224 |   await expect(page).toHaveURL(reportUrl)
  225 |   await page.goForward()
  226 |   await expect(page).toHaveURL(returnedUrl)
  227 |   await expect(
  228 |     page.getByRole('textbox', { name: '搜索词句与备注' }),
  229 |   ).toHaveValue('for example')
  230 |   await expect(listLink).toBeFocused()
  231 |   const forwardPosition = await page.evaluate(() => scrollY)
  232 |   expect(Math.abs(forwardPosition - listPosition)).toBeLessThan(3)
  233 |   expect(
  234 |     (await localState(page)).sessions.filter((session) => session.simulation),
  235 |   ).toHaveLength(1)
  236 |   await writeFile(
  237 |     info.outputPath('source-phase-history.json'),
  238 |     JSON.stringify(
  239 |       {
  240 |         state,
  241 |         studyId,
  242 |         noteUrl,
  243 |         simulationUrl,
  244 |         reportUrl,
  245 |         backUrl,
  246 |         forwardPosition,
  247 |         returnedUrl,
  248 |         listPosition,
  249 |         actualAnswers,
  250 |         reportAppearance,
  251 |         contrast,
  252 |       },
  253 |       null,
  254 |       2,
  255 |     ),
  256 |   )
  257 |   await finishNetwork(info)
  258 | })
  259 | 
```