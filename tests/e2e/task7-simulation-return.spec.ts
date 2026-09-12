import { expect, test, type Page } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import {
  onboard,
  enterScene,
  capture,
  localState,
  protect,
} from './task7-browser-helpers'
async function create(page: Page) {
  await onboard(page)
  await enterScene(page, 'coffee-order', 'A2')
  await capture(page, 'black', 'word')
  await page.getByRole('link', { name: '查看词句', exact: true }).click()
  await page.getByRole('button', { name: '用所选来源模拟练习' }).click()
  await page.getByRole('button', { name: '开始这次定向练习' }).click()
  await expect(
    page.getByRole('textbox', { name: '我回忆的表达' }),
  ).toBeVisible()
  return new URL(page.url()).searchParams.get('id')!
}
test('H: actual me-origin simulation return wins in recall, compose and application while original note remains independently reachable', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(90000)
  const finishNetwork = await protect(context, baseURL!)
  const id = await create(page)
  const results = []
  for (const phase of ['recall', 'compose', 'application']) {
    await page.goto('/me')
    const saved = page.locator(`a[href^="/notebook/simulation?id=${id}&"]`)
    await saved.click()
    expect(new URL(page.url()).searchParams.get('from')).toBe('/me')
    const label =
      phase === 'recall'
        ? '我回忆的表达'
        : phase === 'compose'
          ? '我的替换或造句'
          : '英文内容'
    if (phase === 'application')
      await page.getByRole('button', { name: /键盘/ }).click()
    const input = page.getByRole('textbox', { name: label })
    await input.fill(`Synthetic ${phase} draft retained on cancel.`)
    await page.getByRole('link', { name: '退出本次练习' }).click()
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(input).toHaveValue(
      `Synthetic ${phase} draft retained on cancel.`,
    )
    await page
      .getByRole('button', {
        name: phase === 'application' ? '取消' : '取消本次输入',
        exact: true,
      })
      .click()
    await page.getByRole('link', { name: '退出本次练习' }).click()
    await expect(page).toHaveURL(`${baseURL}/me`)
    results.push({ phase, returned: page.url() })
    await saved.click()
    await expect(
      page.getByRole('link', { name: '返回词句或记录簿' }),
    ).toHaveAttribute('href', /\/notebook\/note\?id=/)
    if (phase === 'recall') {
      await page.getByRole('textbox', { name: '我回忆的表达' }).fill('black')
      await page.getByRole('button', { name: '保存回忆并查看' }).click()
      await expect(
        page.getByRole('textbox', { name: '我的替换或造句' }),
      ).toBeVisible()
    } else if (phase === 'compose') {
      await page
        .getByRole('textbox', { name: '我的替换或造句' })
        .fill('I would like black coffee.')
      await page.getByRole('button', { name: '保存造句并应用' }).click()
      await expect(
        page.getByRole('group', { name: '当前应答问题' }),
      ).toBeVisible()
    }
  }
  await writeFile(
    info.outputPath('me-phase-returns.json'),
    JSON.stringify({ results, state: await localState(page) }, null, 2),
  )
  await finishNetwork(info)
})
for (const phase of ['recall', 'compose'])
  test(`F: ${phase} draft remains phase-owned after another actual window composes and explicitly stops`, async ({
    page,
    context,
    baseURL,
  }, info) => {
    test.setTimeout(90000)
    const finishNetwork = await protect(context, baseURL!)
    const id = await create(page)
    if (phase === 'compose') {
      await page
        .getByRole('textbox', { name: '我回忆的表达' })
        .fill('First saved recall.')
      await page.getByRole('button', { name: '保存回忆并查看' }).click()
      await expect(
        page.getByRole('textbox', { name: '我的替换或造句' }),
      ).toBeVisible()
    }
    const label = phase === 'recall' ? '我回忆的表达' : '我的替换或造句',
      save = phase === 'recall' ? '保存回忆并查看' : '保存造句并应用'
    await page
      .getByRole('textbox', { name: label })
      .fill(`Unsubmitted ${phase} must stay mine.`)
    const other = await context.newPage()
    await other.goto(page.url())
    if (phase === 'recall') {
      await other
        .getByRole('textbox', { name: '我回忆的表达' })
        .fill('Other saved recall.')
      await other.getByRole('button', { name: '保存回忆并查看' }).click()
    }
    await other
      .getByRole('textbox', { name: '我的替换或造句' })
      .fill('Other saved composition.')
    await other.getByRole('button', { name: '保存造句并应用' }).click()
    await expect(
      other.getByRole('group', { name: '当前应答问题' }),
    ).toBeVisible()
    await other.getByRole('button', { name: '停止本次练习' }).click()
    await expect
      .poll(
        async () =>
          (await localState(other)).sessions.find(
            (session) => session.id === id,
          )!.status,
      )
      .toBe('abandoned')
    await page.getByRole('button', { name: save }).click()
    await page.getByRole('button', { name: '读取最新进度' }).click()
    await expect(page.getByRole('textbox', { name: label })).toHaveValue(
      `Unsubmitted ${phase} must stay mine.`,
    )
    await expect(page.getByRole('button', { name: save })).toBeDisabled()
    await page.getByRole('button', { name: '取消本次输入' }).click()
    await expect(page.getByText(/这次练习已停止，未记作完成/)).toBeVisible()
    const final = await localState(page)
    expect(
      final.sessions.find((session) => session.id === id)!.simulation!
        .composition!.text,
    ).toBe('Other saved composition.')
    expect(final.pointsLedger).toEqual([])
    await other.close()
    await writeFile(
      info.outputPath('other-window-stopped.json'),
      JSON.stringify({ phase, final }, null, 2),
    )
    await finishNetwork(info)
  })
