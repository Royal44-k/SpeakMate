import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useOfflineReadiness } from './offline-readiness'

afterEach(() => vi.unstubAllGlobals())
describe('verified controlling-worker readiness', () => {
  it('keeps unknown availability when a stale controller cannot receive messages', () => {
    const serviceWorker = new EventTarget()
    Object.assign(serviceWorker, {
      controller: {
        postMessage: () => {
          throw new Error('detached')
        },
      },
    })
    vi.stubGlobal('navigator', { serviceWorker })
    const hook = renderHook(() => useOfflineReadiness('dining', 1))
    expect(hook.result.current).toBeUndefined()
  })
  it('accepts only matching controller/category status and does not reuse another category readiness', () => {
    const serviceWorker = new EventTarget()
    const controller = { postMessage: vi.fn() }
    Object.assign(serviceWorker, { controller })
    vi.stubGlobal('navigator', { serviceWorker })
    const hook = renderHook(
      ({ category }: { category: 'dining' | 'work' }) =>
        useOfflineReadiness(category, 1),
      { initialProps: { category: 'dining' } },
    )
    const publish = (source: object) => {
      const event = new MessageEvent('message', {
        data: {
          type: 'OFFLINE_STATUS',
          shellReady: true,
          categories: { dining: true },
        },
      })
      Object.defineProperty(event, 'source', { value: source })
      act(() => serviceWorker.dispatchEvent(event))
    }
    publish({})
    expect(hook.result.current).toBeUndefined()
    publish(controller)
    expect(hook.result.current).toEqual({
      category: 'dining',
      shell: true,
      content: true,
    })
    hook.rerender({ category: 'work' })
    expect(hook.result.current).toBeUndefined()
  })
})
