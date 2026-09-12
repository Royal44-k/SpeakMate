import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import {
  onboard,
  enterScene,
  answer,
  capture,
  localState,
  protect,
} from './task7-browser-helpers'

test('Named brief boundaries: a private polite refusal completes normally; health request remains fictional; legacy navigation data stays safe', async ({
  page,
  context,
  baseURL,
}, info) => {
  const audit = await protect(context, baseURL!)
  await onboard(page)
  const socialId = await enterScene(page, 'polite-refusal', 'A1')
  await answer(page)
  await page.getByText('本题参考表达', { exact: true }).click()
  await page.getByRole('button', { name: '使用参考 2 并确认' }).click()
  await expect(page.getByRole('textbox', { name: '英文内容' })).toHaveValue(
    "I'd rather not say.",
  )
  await page.getByRole('button', { name: '提交这一轮' }).click()
  await expect(page.getByRole('textbox', { name: '英文内容' })).toBeHidden()
  await answer(page)
  await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
  await expect(
    page.getByRole('heading', { name: '这轮已保存。' }),
  ).toBeVisible()
  const social = (await localState(page)).sessions.find(
    (session) => session.id === socialId,
  )!
  expect(social.status).toBe('completed')
  await page.goto(
    '/scenes/prepare?scene=doctor-appointment&level=A1&mode=short',
  )
  await expect(
    page.getByText(/本轮仅准备预约请求，不做分诊、不确认真实预约/),
  ).toBeVisible()
  await page.getByRole('link', { name: '进入对话舞台' }).click()
  await expect(
    page.getByRole('region', { name: '当前问题', exact: true }),
  ).toBeVisible()
  const healthId = new URL(page.url()).searchParams.get('id')!
  const note = await capture(page, 'synthetic fictional request', 'phrase')
  for (let n = 0; n < 3; n++) await answer(page)
  await expect(
    page
      .getByLabel('本轮结尾')
      .getByText(
        /No real appointment was booked or medical or emergency service contacted/,
      ),
  ).toBeVisible()
  await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
  await expect(
    page.getByRole('heading', { name: '这轮已保存。' }),
  ).toBeVisible()
  await expect(page.getByText(/也不代表真实服务已完成/)).toBeVisible()
  await page.getByRole('link', { name: '查看本次复盘' }).click()
  await expect(
    page.getByText(/不提供语法、词汇、自然度或发音分数/),
  ).toBeVisible()
  const before = await localState(page)
  expect(
    before.sessions.find((session) => session.id === healthId)!.status,
  ).toBe('completed')
  expect(before.pointsLedger).toEqual([])
  await page.goto(`/notebook/note?id=${note.id}`)
  await page.evaluate(
    (noteUrl) =>
      sessionStorage.setItem(
        'speakmate-route-stack',
        JSON.stringify(['/notebook', noteUrl]),
      ),
    `/notebook/note?id=${note.id}`,
  )
  await page.reload()
  await page.getByRole('link', { name: '返回记录簿', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '记录簿', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: note.text, exact: true }),
  ).toBeVisible()
  expect(await localState(page)).toEqual(before)
  await writeFile(
    info.outputPath('communication-boundaries.json'),
    JSON.stringify(
      {
        socialId,
        healthId,
        before,
        returnedUrl: page.url(),
        legacyArray: 'safe return; not precise history reconstruction',
      },
      null,
      2,
    ),
  )
  await audit(info)
})
