import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import {
  localState,
  protect,
  onboard,
  enterScene,
  capture,
  answer,
} from './task7-browser-helpers'

test('F: five actual v2 source selections retain independent source levels and confirm separate versus omitted chilli', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(180000)
  const finishNetwork = await protect(context, baseURL!)
  await onboard(page)
  const results: unknown[] = []
  const expectedQuestions: Record<string, string> = {
    A1: 'Chilli mixed into the pasta, or on the side?',
    A2: 'Would you like a little chilli mixed into your pasta, or served on the side?',
    B1: 'Would you like chilli in your pasta, or would you prefer none? Tell me your preference.',
    B2: 'Would you like the chilli left out or a little added, while keeping the other ingredients unchanged?',
    C1: 'How would you make clear whether chilli should be omitted or added, without suggesting changes to the rest of the dish?',
  }
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1']) {
    const separate = ['A1', 'A2'].includes(level)
    await enterScene(page, 'restaurant-order', level)
    const note = await capture(
      page,
      separate ? 'on the side' : 'No chilli, please.',
      separate ? 'phrase' : 'sentence',
    )
    const selected = note.sources.at(-1)!
    await page.getByRole('link', { name: '查看词句', exact: true }).click()
    await page.getByLabel('解析所用来源').selectOption(selected.id)
    await expect(
      page.getByText('本语境完整匹配', { exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: '用所选来源模拟练习' }).click()
    await page.getByRole('button', { name: '开始这次定向练习' }).click()
    await page
      .getByRole('textbox', { name: '我回忆的表达' })
      .fill(
        separate
          ? 'I remember serving separately.'
          : 'I remember leaving chilli out.',
      )
    await page.getByRole('button', { name: '保存回忆并查看' }).click()
    await page
      .getByRole('textbox', { name: '我的替换或造句' })
      .fill(
        separate
          ? 'Could I have the chilli on the side?'
          : 'No chilli, please.',
      )
    await page.getByRole('button', { name: '保存造句并应用' }).click()
    await expect(
      page.getByRole('region', { name: '当前问题', exact: true }),
    ).toBeVisible()
    const id = new URL(page.url()).searchParams.get('id')!
    const initial = (await localState(page)).sessions.find(
      (session) => session.id === id,
    )!
    expect(initial.level).toBe(level)
    expect(initial.simulation!.source).toMatchObject({
      noteId: note.id,
      sourceId: selected.id,
      snapshot: selected,
    })
    expect(initial.simulation!.descriptor.version).toBe(2)
    expect(initial.simulation!.descriptor.questionIds).toHaveLength(3)
    await answer(page)
    await answer(page)
    const question = page.getByRole('group', { name: '当前应答问题' })
    await expect(question).toContainText(expectedQuestions[level])
    const actualQuestion = await question.innerText()
    const actualAnswer = await answer(page)
    const terminal = (await localState(page)).sessions.find(
      (session) => session.id === id,
    )!
    expect(
      terminal.gradedDialogue!.state.facts.find((fact) => fact.key === 'chilli')
        ?.value,
    ).toBe(separate ? 'separate' : 'no')
    expect(actualQuestion).toContain(expectedQuestions[level])
    expect(actualAnswer).toMatch(
      separate ? /side|separat/i : /omit|leave.*out|no chilli/i,
    )
    await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
    await expect(
      page.getByRole('heading', { name: '这轮已保存。' }),
    ).toBeVisible()
    await page.reload()
    const saved = (await localState(page)).sessions.find(
      (session) => session.id === id,
    )!
    expect(saved.status).toBe('completed')
    expect(saved.gradedDialogue).toEqual(terminal.gradedDialogue)
    results.push({ level, actualQuestion, actualAnswer, session: saved })
  }
  expect((await localState(page)).notebook).toHaveLength(2)
  expect((await localState(page)).pointsLedger).toEqual([])
  await writeFile(
    info.outputPath('v2-five-real-simulations.json'),
    JSON.stringify(results, null, 2),
  )
  await finishNetwork(info)
})
