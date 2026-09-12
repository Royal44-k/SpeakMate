import { expect, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import {
  onboard,
  enterScene,
  capture,
  localState,
  protect,
  answer,
} from './task7-browser-helpers'

test('F: partial fragment targets only selected coverage, legal cross-note source-ID collision stays note-owned, unknown text offers self-review without simulation', async ({
  page,
  context,
  browser,
  baseURL,
}, info) => {
  test.setTimeout(120000)
  const finishNetwork = await protect(context, baseURL!)
  await onboard(page)
  await enterScene(page, 'coffee-order', 'A2')
  const exact = await capture(page, 'black', 'word')
  await answer(page)
  await expect(
    page.getByRole('group', { name: '当前应答问题' }),
  ).not.toContainText(exact.sources[0].originalText)
  const partial = await capture(
    page,
    'I prefer black coffee with a synthetic detail.',
    'sentence',
  )
  const unknown = await capture(page, 'synthetic-florbnax', 'word')
  await page.getByRole('link', { name: '退出本次练习' }).click()
  await page.goto('/privacy')
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出学习数据' }).click()
  const originalPath = info.outputPath('actual-before-collision.json')
  await (await downloading).saveAs(originalPath)
  const fixture = JSON.parse(await readFile(originalPath, 'utf8'))
  // Named legal identity-collision fixture only; all source text and learning
  // came from UI. Reuse a source id in another note, never merge their bodies.
  const collided = fixture.notebook.find(
    (note: { id: string }) => note.id === partial.id,
  )
  collided.sources[0].id = exact.sources[0].id
  const restoredContext = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const finishRestored = await protect(restoredContext, baseURL!, 'restored-')
  const restored = await restoredContext.newPage()
  try {
    await restored.goto('/privacy')
    await restored.waitForFunction(
      () => !!navigator.serviceWorker.controller,
      undefined,
      { timeout: 30000 },
    )
    await restored
      .locator('input[type=file]')
      .setInputFiles({
        name: 'legal-cross-note-source-id.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(fixture)),
      })
    await restored.getByRole('button', { name: '确认合并恢复' }).click()
    await expect(restored.getByText(/恢复完成/)).toBeVisible()
    await restored.goto(`/notebook/note?id=${partial.id}`)
    await expect(
      restored.getByText('仅部分片段有覆盖', { exact: true }),
    ).toBeVisible()
    await restored.getByRole('button', { name: '用所选来源模拟练习' }).click()
    await expect(
      restored.getByText('仅练明确选中的覆盖片段，不解析、确认或评分原整句。', {
        exact: true,
      }),
    ).toBeVisible()
    await restored
      .getByLabel('本次练习的已覆盖表达')
      .selectOption('coffee.word.black')
    await restored.getByRole('button', { name: '开始这次定向练习' }).click()
    await expect(
      restored.getByRole('textbox', { name: '我回忆的表达' }),
    ).toBeVisible()
    const simulation = (await localState(restored)).sessions.find(
      (session) => session.simulation,
    )!
    expect(simulation.simulation!.source).toMatchObject({
      noteId: partial.id,
      sourceId: exact.sources[0].id,
      snapshot: collided.sources[0],
      noteText: partial.text,
    })
    expect(simulation.simulation!.source.snapshot.originalText).not.toBe(
      exact.sources[0].originalText,
    )
    expect(simulation.simulation!.target).toMatchObject({
      coverage: 'partial',
      text: 'black',
    })
    await restored.goto(`/notebook/note?id=${unknown.id}`)
    await expect(
      restored.getByText('当前本地资料未收录', { exact: true }),
    ).toBeVisible()
    await expect(
      restored.getByRole('button', { name: '用所选来源模拟练习' }),
    ).toHaveCount(0)
    await restored.getByRole('button', { name: '编辑词句' }).click()
    const literal =
      '<img src=x onerror="window.syntheticLeak=1"> <script>window.syntheticLeak=2</script>'
    await restored
      .getByRole('textbox', { name: '个人备注', exact: true })
      .fill(literal)
    await restored.getByRole('button', { name: '保存修改' }).click()
    await expect(restored.getByText(literal, { exact: true })).toBeVisible()
    expect(
      await restored.evaluate(() => Object.hasOwn(window, 'syntheticLeak')),
    ).toBe(false)
    await restored.getByRole('button', { name: '开始自我回忆' }).click()
    await restored.getByRole('button', { name: '已尝试回忆，查看原文' }).click()
    await restored.getByRole('button', { name: '模糊', exact: true }).click()
    await expect(restored.getByText(/本次自评已保存/)).toBeVisible()
    const final = await localState(restored)
    expect(final.reviews).toHaveLength(1)
    expect(final.pointsLedger).toEqual([])
    expect(final.sessions.filter((session) => session.simulation)).toHaveLength(
      1,
    )
    await writeFile(
      info.outputPath('partial-unknown-collision.json'),
      JSON.stringify({ simulation, final }, null, 2),
    )
    await finishRestored(info)
  } finally {
    await restoredContext.close()
  }
  await finishNetwork(info)
})
