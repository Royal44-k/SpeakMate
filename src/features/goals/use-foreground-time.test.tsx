import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { useForegroundTime } from './use-foreground-time'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

it('retains the original failed segment across ordinary completion and retries it exactly once without awards', async () => {
  vi.useFakeTimers({
    toFake: ['Date', 'performance', 'setInterval', 'clearInterval'],
  })
  vi.setSystemTime(new Date('2026-09-10T02:00:00Z'))
  const repo = createMemoryRepositories()
  const profile = await repo.profiles.ensureGuestProfile()
  const record = repo.learning.recordEvent.bind(repo.learning)
  const writes = vi
    .spyOn(repo.learning, 'recordEvent')
    .mockRejectedValue(new Error('quota'))
  const hook = renderHook(
    ({ active }) => useForegroundTime(repo, profile.id, 'practice_run', active),
    {
      initialProps: { active: true },
    },
  )
  await act(async () => {
    vi.advanceTimersByTime(4000)
  })
  await act(async () => {
    hook.rerender({ active: false })
  })
  expect(hook.result.current.error).toContain('尚未保存')
  const original = structuredClone(writes.mock.calls[0][0])
  expect(original.type).toBe('foreground-time-recorded')
  expect(original).toMatchObject({ durationMs: 4000, dateKey: '2026-09-10' })
  writes.mockImplementation(record)
  await act(async () => {
    hook.result.current.retry()
  })
  await act(async () => {
    hook.result.current.retry()
  })
  const state = await repo.learning.getState(profile.id)
  expect(state.events).toEqual([original])
  expect(state.pointsLedger).toEqual([])
  expect(hook.result.current.error).toBe('')
  hook.unmount()
})
