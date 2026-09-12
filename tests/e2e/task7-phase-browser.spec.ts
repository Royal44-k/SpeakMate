import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import {
  onboard,
  enterScene,
  capture,
  localState,
  protect,
} from './task7-browser-helpers'

for (const phase of ['recall', 'composition'] as const)
  for (const action of ['edit', 'cancel', 'submit'] as const)
    test(`F: native ${phase} transaction abort and deferred real recovery cannot undo ${action}`, async ({
      page,
      context,
      baseURL,
    }, info) => {
      test.setTimeout(90000)
      const finishNetwork = await protect(context, baseURL!)
      await onboard(page)
      await enterScene(page, 'coffee-order', 'A2')
      await capture(page, 'black', 'word')
      await page.getByRole('link', { name: '查看词句', exact: true }).click()
      await page.getByRole('button', { name: '用所选来源模拟练习' }).click()
      await page.getByRole('button', { name: '开始这次定向练习' }).click()
      if (phase === 'composition') {
        await page
          .getByRole('textbox', { name: '我回忆的表达' })
          .fill('Black coffee.')
        await page.getByRole('button', { name: '保存回忆并查看' }).click()
      }
      const saveName = phase === 'recall' ? '保存回忆并查看' : '保存造句并应用'
      const input = page.getByRole('textbox', {
        name: phase === 'recall' ? '我回忆的表达' : '我的替换或造句',
      })
      await input.fill('Original synthetic recall.')
      const before = await localState(page)
      await page.evaluate(() => {
        const fault = {
          armed: true,
          aborted: false,
          hold: false,
          deliveries: [] as (() => void)[],
        }
        Object.assign(window, {
          __phaseFault: fault,
          __releasePhase: () => {
            while (fault.deliveries.length) fault.deliveries.shift()!()
          },
        })
        const put = IDBObjectStore.prototype.put
        IDBObjectStore.prototype.put = function (value, key) {
          const request = put.call(this, value, key)
          if (
            fault.armed &&
            this.name === 'sessions' &&
            value.simulation?.recall
          ) {
            fault.armed = false
            fault.aborted = true
            this.transaction.abort()
          }
          return request
        }
        const getAll = IDBObjectStore.prototype.getAll
        IDBObjectStore.prototype.getAll = function (...args) {
          const request = Reflect.apply(getAll, this, args) as IDBRequest
          if (
            fault.hold &&
            this.name === 'sessions' &&
            this.transaction.mode === 'readonly'
          ) {
            fault.hold = false
            const add = request.addEventListener.bind(request)
            Object.defineProperty(request, 'addEventListener', {
              value(
                type: string,
                listener: EventListenerOrEventListenerObject,
                options?: boolean | AddEventListenerOptions,
              ) {
                if (type !== 'success') return add(type, listener, options)
                return add(
                  type,
                  (event) =>
                    fault.deliveries.push(() =>
                      typeof listener === 'function'
                        ? listener.call(request, event)
                        : listener.handleEvent(event),
                    ),
                  options,
                )
              },
            })
          }
          return request
        }
      })
      await page.getByRole('button', { name: saveName }).click()
      await expect(
        page.getByRole('button', { name: '读取最新进度' }),
      ).toBeVisible()
      expect(
        await page.evaluate(
          () =>
            (window as unknown as { __phaseFault: { aborted: boolean } })
              .__phaseFault.aborted,
        ),
      ).toBe(true)
      expect(await localState(page)).toEqual(before)
      await expect(input).toHaveValue('Original synthetic recall.')
      await page.evaluate(() => {
        ;(
          window as unknown as { __phaseFault: { hold: boolean } }
        ).__phaseFault.hold = true
      })
      await page.getByRole('button', { name: '读取最新进度' }).click()
      await page.waitForFunction(
        () =>
          (window as unknown as { __phaseFault: { deliveries: unknown[] } })
            .__phaseFault.deliveries.length === 1,
      )
      if (action === 'edit')
        await input.fill('Newer edited recall must remain.')
      else if (action === 'cancel')
        await page.getByRole('button', { name: '取消本次输入' }).click()
      else {
        await page.getByRole('button', { name: saveName }).click()
        if (phase === 'recall')
          await expect(
            page.getByRole('textbox', { name: '我的替换或造句' }),
          ).toBeVisible()
        else
          await expect(
            page.getByRole('region', { name: '当前问题', exact: true }),
          ).toBeVisible()
      }
      await page.evaluate(() =>
        (window as unknown as { __releasePhase: () => void }).__releasePhase(),
      )
      if (action === 'submit') {
        await expect(input).toHaveCount(0)
        if (phase === 'recall')
          await expect(
            page.getByRole('textbox', { name: '我的替换或造句' }),
          ).toHaveValue('')
        else
          await expect(
            page.getByRole('region', { name: '当前问题', exact: true }),
          ).toBeVisible()
      } else
        await expect(input).toHaveValue(
          action === 'edit' ? 'Newer edited recall must remain.' : '',
        )
      const after = await localState(page)
      const simulation = after.sessions.find((session) => session.simulation)!
      expect(simulation.simulation![phase]?.text).toBe(
        action === 'submit' ? 'Original synthetic recall.' : undefined,
      )
      expect(after.pointsLedger).toEqual([])
      await writeFile(
        info.outputPath('phase-abort-recovery.json'),
        JSON.stringify({ phase, action, before, after }, null, 2),
      )
      await finishNetwork(info)
    })
