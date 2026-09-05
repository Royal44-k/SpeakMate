import { expect, test } from '@playwright/test'

test('recorded audio can be submitted without browser speech recognition', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'MediaRecorder mock targets the Chromium recording path.',
  )
  await page.addInitScript(() => {
    class Track extends EventTarget {
      stop() {}
    }
    class Recorder extends EventTarget {
      static isTypeSupported() {
        return true
      }
      state = 'inactive'
      mimeType = 'audio/webm'
      start() {
        this.state = 'recording'
      }
      stop() {
        if (this.state !== 'recording') return
        this.state = 'inactive'
        const dataEvent = new Event('dataavailable') as Event & { data: Blob }
        Object.defineProperty(dataEvent, 'data', {
          value: new Blob(['voice'], { type: 'audio/webm' }),
        })
        this.dispatchEvent(dataEvent)
        this.dispatchEvent(new Event('stop'))
      }
    }
    Object.defineProperty(window, 'MediaRecorder', { value: Recorder })
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: async () => ({ getTracks: () => [new Track()] }) },
    })
    Object.defineProperty(window, 'AudioContext', {
      value: class {
        constructor() {
          throw new Error('meter unavailable')
        }
      },
    })
    delete window.SpeechRecognition
    delete window.webkitSpeechRecognition
  })

  let receivedAudioOnly = false
  await page.route('**/api/v1/turns', async (route) => {
    const body = route.request().postDataBuffer()?.toString('utf8') ?? ''
    receivedAudioOnly =
      body.includes('name="audio"') && !body.includes('name="transcript"')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reply: {
          text: 'May I see your passport?',
          hintZh: '继续确认身份。',
          emotion: 'warm',
        },
        feedback: {
          heard: 'I have a reservation.',
          corrected: null,
          naturalAlternative: null,
          explanationZh: '表达清楚。',
          issueTags: [],
        },
        progress: { completedGoalIds: [], shouldOfferCompletion: false },
        provider: 'cloudflare',
        degraded: false,
        requestId: 'req_audio',
        latencyMs: 20,
      }),
    })
  })

  await page.goto('/session/new?scene=hotel-check-in&level=B1')
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await page.getByRole('button', { name: '开始录音' }).click()
  await page.waitForTimeout(900)
  await page.getByRole('button', { name: '停止录音' }).click()
  await expect(page.getByText(/将先尝试云端识别/)).toBeVisible()
  await page.getByRole('button', { name: '取消' }).click()
  await expect(page.getByText(/将先尝试云端识别/)).toBeHidden()
  await page.getByRole('button', { name: '开始录音' }).click()
  await page.waitForTimeout(900)
  await page.getByRole('button', { name: '停止录音' }).click()
  await page.getByRole('button', { name: '提交这一轮' }).click()
  await page.getByRole('button', { name: /这句话表达得很清楚/ }).click()
  await expect(page.getByText('表达清楚。')).toBeVisible()
  expect(receivedAudioOnly).toBe(true)
})
