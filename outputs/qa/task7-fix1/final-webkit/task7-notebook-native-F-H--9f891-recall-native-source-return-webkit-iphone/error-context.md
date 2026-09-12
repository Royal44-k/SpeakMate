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
    19 × locator resolved to <a href="/notebook/note?id=b82b4aa5-b5e1-4208-a807-177ddde4480d">查看词句</a>
       - unexpected value "inactive"

```

```yaml
- link "查看词句":
  - /url: /notebook/note?id=b82b4aa5-b5e1-4208-a807-177ddde4480d
```

# Test source

```ts
  106 |   ).toBeVisible()
  107 |   await page.getByRole('button', { name: '保存回忆并查看' }).click()
  108 |   await expect(page.getByRole('button', { name: '读取最新进度' })).toBeVisible()
  109 |   await page.getByRole('button', { name: '读取最新进度' }).click()
  110 |   await expect(page.getByText(/这份输入仍保留为原来的回忆草稿/)).toBeVisible()
  111 |   await expect(oldDraft).toHaveValue('My original recall remains mine.')
  112 |   await expect(
  113 |     page.getByRole('button', { name: '保存回忆并查看' }),
  114 |   ).toBeDisabled()
  115 |   await page.getByRole('link', { name: '退出本次练习' }).click()
  116 |   await page.getByRole('button', { name: '继续练习', exact: true }).click()
  117 |   expect(page.url()).toBe(simulationUrl)
  118 |   await expect(oldDraft).toHaveValue('My original recall remains mine.')
  119 |   await page.getByRole('button', { name: '取消本次输入' }).click()
  120 |   await expect(
  121 |     page.getByRole('textbox', { name: '我的替换或造句' }),
  122 |   ).toHaveValue('')
  123 |   await other.close()
  124 |   await page
  125 |     .getByRole('textbox', { name: '我的替换或造句' })
  126 |     .fill('For example, we can describe a friend.')
  127 |   await page.getByRole('button', { name: '保存造句并应用' }).click()
  128 |   await expect(
  129 |     page.getByRole('region', { name: '当前问题', exact: true }),
  130 |   ).toBeVisible()
  131 |   await page.reload()
  132 |   const actualAnswers: string[] = []
  133 |   for (let n = 0; n < 5; n++) actualAnswers.push(await answer(page))
  134 |   await expect(
  135 |     page.getByRole('button', { name: '确认结束并保存复盘' }),
  136 |   ).toBeVisible()
  137 |   await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
  138 |   await expect(
  139 |     page.getByRole('heading', { name: '这轮已保存。' }),
  140 |   ).toBeVisible()
  141 |   state = await localState(page)
  142 |   simulation = state.sessions.find((session) => session.id === id)!
  143 |   expect(simulation.status).toBe('completed')
  144 |   expect(simulation.simulation!.recall!.text).toBe('For example, a park.')
  145 |   expect(simulation.simulation!.composition!.text).toBe(
  146 |     'For example, we can describe a friend.',
  147 |   )
  148 |   expect(state.turns.filter((turn) => turn.sessionId === id)).toHaveLength(5)
  149 |   expect(state.pointsLedger).toEqual([])
  150 |   await page.getByRole('link', { name: '查看本次复盘' }).click()
  151 |   const reportUrl = page.url()
  152 |   const listReturn = page.getByRole('link', { name: '返回记录簿', exact: true })
  153 |   await listReturn.scrollIntoViewIfNeeded()
  154 |   await listReturn.focus()
  155 |   await expect(listReturn).toBeFocused()
  156 |   const reportAppearance = await listReturn.evaluate((link) => {
  157 |     const rect = link.getBoundingClientRect()
  158 |     const section = link.closest('section')!
  159 |     const heading = section.querySelector('h2')!
  160 |     return {
  161 |       width: rect.width,
  162 |       height: rect.height,
  163 |       top: rect.top,
  164 |       bottom: rect.bottom,
  165 |       viewportHeight: innerHeight,
  166 |       linkColor: getComputedStyle(link).color,
  167 |       headingColor: getComputedStyle(heading).color,
  168 |       background: getComputedStyle(section.closest('header')!).backgroundColor,
  169 |       outline: getComputedStyle(link).outlineStyle,
  170 |     }
  171 |   })
  172 |   expect(reportAppearance.height).toBeGreaterThanOrEqual(44)
  173 |   expect(reportAppearance.width).toBeGreaterThanOrEqual(44)
  174 |   expect(reportAppearance.top).toBeGreaterThanOrEqual(0)
  175 |   expect(reportAppearance.bottom).toBeLessThanOrEqual(
  176 |     reportAppearance.viewportHeight,
  177 |   )
  178 |   expect(reportAppearance.linkColor).toBe('rgb(255, 255, 255)')
  179 |   expect(reportAppearance.headingColor).toBe(reportAppearance.linkColor)
  180 |   expect(reportAppearance.outline).toBe('solid')
  181 |   const luminance = (color: string) =>
  182 |     color
  183 |       .match(/\d+/g)!
  184 |       .slice(0, 3)
  185 |       .map(Number)
  186 |       .map((part) => part / 255)
  187 |       .map((part) =>
  188 |         part <= 0.04045 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4,
  189 |       )
  190 |       .reduce(
  191 |         (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
  192 |         0,
  193 |       )
  194 |   const contrast =
  195 |     (luminance(reportAppearance.linkColor) + 0.05) /
  196 |     (luminance(reportAppearance.background) + 0.05)
  197 |   expect(contrast).toBeGreaterThanOrEqual(4.5)
  198 |   await page.screenshot({ path: info.outputPath('report-direct-return.png') })
  199 |   await expect(
  200 |     page.getByRole('link', { name: '返回词句或记录簿' }).last(),
  201 |   ).toHaveAttribute('href', new URL(noteUrl).pathname + new URL(noteUrl).search)
  202 |   await page.getByRole('link', { name: '返回记录簿', exact: true }).click()
  203 |   await expect(
  204 |     page.getByRole('textbox', { name: '搜索词句与备注' }),
  205 |   ).toHaveValue('for example')
> 206 |   await expect(listLink).toBeFocused()
      |                          ^ Error: expect(locator).toBeFocused() failed
  207 |   expect(
  208 |     Math.abs((await page.evaluate(() => scrollY)) - listPosition),
  209 |   ).toBeLessThan(3)
  210 |   const returnedUrl = page.url()
  211 |   await page.goBack()
  212 |   const backUrl = page.url()
  213 |   await info.attach('actual-back-url', {
  214 |     body: JSON.stringify({ reportUrl, returnedUrl, backUrl }),
  215 |     contentType: 'application/json',
  216 |   })
  217 |   await expect(page).toHaveURL(reportUrl)
  218 |   await page.goForward()
  219 |   await expect(page).toHaveURL(returnedUrl)
  220 |   await expect(
  221 |     page.getByRole('textbox', { name: '搜索词句与备注' }),
  222 |   ).toHaveValue('for example')
  223 |   await expect(listLink).toBeFocused()
  224 |   const forwardPosition = await page.evaluate(() => scrollY)
  225 |   expect(Math.abs(forwardPosition - listPosition)).toBeLessThan(3)
  226 |   expect(
  227 |     (await localState(page)).sessions.filter((session) => session.simulation),
  228 |   ).toHaveLength(1)
  229 |   await writeFile(
  230 |     info.outputPath('source-phase-history.json'),
  231 |     JSON.stringify(
  232 |       {
  233 |         state,
  234 |         studyId,
  235 |         noteUrl,
  236 |         simulationUrl,
  237 |         reportUrl,
  238 |         backUrl,
  239 |         forwardPosition,
  240 |         returnedUrl,
  241 |         listPosition,
  242 |         actualAnswers,
  243 |         reportAppearance,
  244 |         contrast,
  245 |       },
  246 |       null,
  247 |       2,
  248 |     ),
  249 |   )
  250 |   await finishNetwork(info)
  251 | })
  252 | 
```