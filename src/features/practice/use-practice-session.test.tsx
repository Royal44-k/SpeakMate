import { StrictMode, type ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { getSceneBySlug } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import { createIndexedDbRepositories } from '@/infrastructure/persistence/repositories'
import { usePracticeSession } from './use-practice-session'

const scene = adaptScene(getSceneBySlug('coffee-order')!, 'C1')
const repositories = createIndexedDbRepositories()
beforeEach(async () => {
  await repositories.clearLearnerData()
  window.history.replaceState(
    null,
    '',
    '/session/new?scene=coffee-order&level=C1',
  )
})
describe('practice session lifecycle', () => {
  it('creates exactly one session in StrictMode, and a second new round preserves the first', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    )
    const first = renderHook(() => usePracticeSession(scene, 'new'), {
      wrapper,
    })
    await waitFor(() => expect(first.result.current.ready).toBe(true))
    const id = first.result.current.sessionId
    const opening = first.result.current.aiReply
    expect(await repositories.sessions.list()).toHaveLength(1)
    expect(window.location.pathname).toBe(`/session/${id}`)
    first.unmount()
    window.history.replaceState(
      null,
      '',
      '/session/new?scene=coffee-order&level=C1',
    )
    const second = renderHook(() => usePracticeSession(scene, 'new'), {
      wrapper,
    })
    await waitFor(() => expect(second.result.current.ready).toBe(true))
    expect(second.result.current.sessionId).not.toBe(id)
    expect(second.result.current.aiReply).not.toBe(opening)
    expect(await repositories.sessions.list()).toHaveLength(2)
    expect(await repositories.sessions.get(id)).toBeDefined()
  })
})
