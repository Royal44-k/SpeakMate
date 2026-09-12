import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import {
  onboard,
  enterScene,
  localState,
  protect,
} from './task7-browser-helpers'

test('H: native Back cancellation, ordinary draft clear and second Forward retained placeholder use explicit safe source', async ({
  page,
  context,
  baseURL,
}, info) => {
  const finishNetwork = await protect(context, baseURL!)
  await onboard(page)
  const id = await enterScene(page, 'coffee-order', 'A2')
  const url = page.url()
  await page.getByRole('button', { name: /键盘/ }).click()
  await page
    .getByRole('textbox', { name: '英文内容' })
    .fill('Synthetic native back draft.')
  await page.evaluate(() => history.back())
  await expect(
    page.getByRole('button', { name: '继续练习', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: '继续练习', exact: true }).click()
  await expect(page.getByRole('textbox', { name: '英文内容' })).toHaveValue(
    'Synthetic native back draft.',
  )
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await page.waitForFunction(() => !history.state?.__speakmateExitGuard)
  const clean = await page.evaluate(() => ({
    url: location.href,
    state: history.state,
    length: history.length,
  }))
  await page.evaluate(() => history.forward())
  await page.waitForFunction(
    () => history.state?.__speakmateRoutePlaceholder === true,
  )
  expect(page.url()).toBe(url)
  const placeholder = await page.evaluate(() => ({
    url: location.href,
    state: history.state,
    length: history.length,
  }))
  await page.getByRole('link', { name: '退出本次练习' }).click()
  await expect(page).toHaveURL(`${baseURL}/scenes?level=A2`)
  expect(
    (await localState(page)).sessions.map((session) => session.id),
  ).toEqual([id])
  await writeFile(
    info.outputPath('native-placeholder.json'),
    JSON.stringify({ clean, placeholder, returned: page.url() }, null, 2),
  )
  await finishNetwork(info)
})
