import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHash, webcrypto } from 'node:crypto'
import { GET } from '@/app/content/v1/[category]/route'
import { publicContentProvider } from './public-category'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
async function fixture() {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubGlobal('crypto', webcrypto)
  const body = await (
    await GET(new Request('https://local.test/content/v1/dining'), {
      params: Promise.resolve({ category: 'dining' }),
    })
  ).text()
  const hash = createHash('sha256').update(body).digest('hex')
  const serviceWorker = new EventTarget() as EventTarget & {
    controller: object | null
  }
  const publish = (request: { requestId: string }, source: object) => {
    const event = new MessageEvent('message', {
      data: {
        type: 'CATEGORY_BUILD',
        schemaVersion: 1,
        requestId: request.requestId,
        category: 'dining',
        buildId: 'verified-build',
        sha256: hash,
        bytes: Buffer.byteLength(body),
      },
    })
    Object.defineProperty(event, 'source', { value: source })
    serviceWorker.dispatchEvent(event)
  }
  const controller = {
    postMessage: vi.fn((request: { requestId: string }) =>
      queueMicrotask(() => publish(request, controller)),
    ),
  }
  serviceWorker.controller = controller
  vi.stubGlobal('navigator', { serviceWorker })
  const fetcher = vi.fn<typeof fetch>(
    async () =>
      new Response(body, {
        headers: {
          'content-type': 'application/json',
          'x-speakmate-build': 'verified-build',
          'x-speakmate-category-sha256': hash,
        },
      }),
  )
  return { serviceWorker, controller, fetcher, publish, body }
}
describe('real production category verification branch', () => {
  it('bounds missing control and ignores a wrong request ID or a different proof sender', async () => {
    for (const failure of ['missing', 'request', 'sender']) {
      const f = await fixture()
      vi.useFakeTimers()
      if (failure === 'missing') f.serviceWorker.controller = null
      else
        f.controller.postMessage.mockImplementation((request) =>
          queueMicrotask(() =>
            f.publish(
              failure === 'request' ? { requestId: 'wrong' } : request,
              failure === 'sender' ? {} : f.controller,
            ),
          ),
        )
      const outcome = publicContentProvider(f.fetcher)
        .load({ sceneId: 'dining-01', level: 'C1' })
        .then(
          () => 'unexpected success',
          (error) => (error as Error).message,
        )
      await vi.advanceTimersByTimeAsync(10_000)
      expect(await outcome).toContain('重试')
      expect(f.fetcher).not.toHaveBeenCalled()
      vi.useRealTimers()
    }
  })
  it('cancels a stalled production download within thirty seconds after proof', async () => {
    const f = await fixture()
    vi.useFakeTimers()
    f.fetcher.mockImplementation(() => new Promise(() => undefined))
    const outcome = publicContentProvider(f.fetcher)
      .load({ sceneId: 'dining-01', level: 'C1' })
      .then(
        () => 'unexpected success',
        (error) => (error as Error).message,
      )
    await vi.advanceTimersByTimeAsync(0)
    expect(f.fetcher).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(30_000)
    expect(await outcome).toContain('重试')
    expect(f.fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true)
  })
  it('fails clearly without Service Workers and never fetches an unverified production pack', async () => {
    const f = await fixture()
    vi.stubGlobal('navigator', {})
    await expect(
      publicContentProvider(f.fetcher).load({
        sceneId: 'dining-01',
        level: 'C1',
      }),
    ).rejects.toThrow(/HTTPS|Safari/)
    expect(f.fetcher).not.toHaveBeenCalled()
  })
  it('bounds an old 2.3 controller without the proof protocol to ten seconds', async () => {
    const f = await fixture()
    vi.useFakeTimers()
    f.controller.postMessage.mockImplementation(() => undefined)
    const attempt = expect(
      publicContentProvider(f.fetcher).load({
        sceneId: 'dining-01',
        level: 'C1',
      }),
    ).rejects.toThrow(/重试|更新/)
    await vi.advanceTimersByTimeAsync(10_000)
    await attempt
    expect(f.fetcher).not.toHaveBeenCalled()
  })
  it('waits for first control then checks matching proof and actual category bytes', async () => {
    const f = await fixture()
    f.serviceWorker.controller = null
    const attempt = publicContentProvider(f.fetcher).load({
      sceneId: 'dining-01',
      level: 'C1',
    })
    expect(f.fetcher).not.toHaveBeenCalled()
    f.serviceWorker.controller = f.controller
    f.serviceWorker.dispatchEvent(new Event('controllerchange'))
    expect((await attempt).status).toBe('available')
    expect(f.controller.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CATEGORY_BUILD',
        schemaVersion: 1,
        category: 'dining',
      }),
    )
  })
  it('rejects a different response hash and a controller change during the download', async () => {
    const f = await fixture()
    f.fetcher.mockImplementationOnce(
      async () =>
        new Response(f.body + ' ', {
          headers: {
            'content-type': 'application/json',
            'x-speakmate-build': 'verified-build',
          },
        }),
    )
    await expect(
      publicContentProvider(f.fetcher).load({
        sceneId: 'dining-01',
        level: 'C1',
      }),
    ).rejects.toThrow(/验证|更新/)
    f.fetcher.mockImplementationOnce(async () => {
      f.serviceWorker.controller = {}
      f.serviceWorker.dispatchEvent(new Event('controllerchange'))
      return new Response(f.body)
    })
    await expect(
      publicContentProvider(f.fetcher).load({
        sceneId: 'dining-01',
        level: 'C1',
      }),
    ).rejects.toThrow(/更新|控制/)
  })
})
