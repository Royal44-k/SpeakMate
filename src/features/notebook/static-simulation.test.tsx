import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { GET } from '@/app/content/v1/[category]/route'
import { createIndexedDbRepositories } from '@/infrastructure/persistence/repositories'
import { deleteDatabase } from '@/infrastructure/persistence/db'
import { StaticLearningShell } from '@/features/practice/static-learning-shell'
import { RouteCoordinator } from '@/components/app-shell/route-coordinator'
import { SmartBackLink } from '@/components/app-shell/smart-back-link'
import { documentNavigation } from '@/components/app-shell/learning-routes'
import {
  visitRoute,
  readRouteHistory,
} from '@/components/app-shell/navigation-history'
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  usePathname: () => window.location.pathname,
  useRouter: () => ({ back: () => history.back() }),
}))
afterEach(async () => {
  vi.unstubAllGlobals()
  await deleteDatabase()
  sessionStorage.clear()
})
it('uses the actual static new route and IndexedDB: chooses the canonical note source, retries public readiness, replaces the real ID and resumes guarded recall', async () => {
  const repo = createIndexedDbRepositories()
  const profile = await repo.profiles.ensureGuestProfile()
  const source = {
    id: 'same-source',
    kind: 'turn' as const,
    originalText: 'Could we test that assumption?',
    sceneId: 'work-05',
    level: 'C1' as const,
    questionId: 'meeting-disagreement.C1.assumption',
    createdAt: '2026-09-11T00:00:00.000Z',
  }
  const base = {
    profileId: profile.id,
    kind: 'sentence' as const,
    normalizedText: '',
    notes: '',
    tags: [],
    favoriteIds: [],
    createdAt: source.createdAt,
    updatedAt: source.createdAt,
  }
  await repo.notebook.save({
    ...base,
    id: 'canonical',
    text: source.originalText,
    sources: [
      {
        id: 'manual',
        kind: 'manual',
        originalText: 'A different context',
        createdAt: source.createdAt,
      },
      source,
    ],
  })
  await repo.notebook.save({
    ...base,
    id: 'unrelated',
    text: 'Different personal text',
    sources: [{ ...source, sceneId: 'work-01' }],
  })
  const fetcher = vi
    .fn<typeof fetch>()
    .mockRejectedValueOnce(new Error('not controlled'))
    .mockImplementation(async () =>
      GET(new Request('https://local.test'), {
        params: Promise.resolve({ category: 'work' }),
      }),
    )
  vi.stubGlobal('fetch', fetcher)
  window.history.replaceState(null, '', '/notebook/note?id=canonical')
  visitRoute('/notebook/note?id=canonical')
  window.history.pushState(
    null,
    '',
    '/notebook/simulation?id=new&source=canonical',
  )
  const first = render(
    <StrictMode>
      <StaticLearningShell kind="simulation" />
      <RouteCoordinator />
    </StrictMode>,
  )
  await screen.findByLabelText('本次使用的来源')
  expect(
    screen.queryByRole('button', { name: '开始这次定向练习' }),
  ).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('本次使用的来源'), {
    target: { value: 'same-source' },
  })
  await screen.findByRole('alert')
  expect(
    screen.queryByText(/此来源与表达没有可用的定向资料/),
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '重试' }))
  fireEvent.click(
    await screen.findByRole('button', { name: '开始这次定向练习' }),
  )
  await screen.findByRole('heading', { name: '先回忆，再查看原文' })
  const [session] = await repo.sessions.list()
  expect(session.simulation?.source.noteId).toBe('canonical')
  expect(session.simulation?.source.snapshot.sceneId).toBe('work-05')
  expect(new URLSearchParams(window.location.search).get('id')).toBe(session.id)
  expect(new URLSearchParams(window.location.search).get('source')).toBeNull()
  window.history.back()
  await waitFor(() => expect(window.location.pathname).toBe('/notebook/note'))
  expect(new URLSearchParams(window.location.search).get('id')).toBe(
    'canonical',
  )
  window.history.forward()
  await waitFor(() =>
    expect(new URLSearchParams(window.location.search).get('id')).toBe(
      session.id,
    ),
  )
  // Native History cannot erase the forward placeholder. It must carry the saved
  // address and same app identity, never revive id=new or create another session.
  const savedEntry = history.state.__speakmateRouteEntry
  await act(async () => {
    const moved = new Promise((resolve) =>
      window.addEventListener('popstate', resolve, { once: true }),
    )
    history.forward()
    await moved
  })
  expect(new URLSearchParams(location.search).get('id')).toBe(session.id)
  expect(history.state.__speakmateRouteEntry).toBe(savedEntry)
  expect(readRouteHistory().entries).toHaveLength(2)
  const nativeBack = vi.spyOn(history, 'back')
  const smart = render(
    <SmartBackLink
      fallbackHref="/notebook/note?id=canonical"
      ariaLabel="占位返回来源"
    />,
  )
  // jsdom has no document navigation: assert the actual anchor permits its safe
  // default destination, not an inferred native Back into the duplicate S.
  const allowed = fireEvent.click(
    screen.getByRole('link', { name: '占位返回来源' }),
  )
  expect(allowed).toBe(true)
  expect(nativeBack).not.toHaveBeenCalled()
  smart.unmount()
  const destination = vi
    .spyOn(documentNavigation, 'replace')
    .mockImplementation((href) => {
      history.replaceState(null, '', href)
      window.dispatchEvent(
        new PopStateEvent('popstate', { state: history.state }),
      )
    })
  fireEvent.click(screen.getByRole('link', { name: '退出本次练习' }))
  expect(destination).toHaveBeenCalledWith('/notebook/note?id=canonical')
  expect(nativeBack).not.toHaveBeenCalled()
  expect(location.pathname + location.search).toBe(
    '/notebook/note?id=canonical',
  )
  destination.mockRestore()
  nativeBack.mockRestore()
  history.back()
  await waitFor(() =>
    expect(new URLSearchParams(location.search).get('id')).toBe(session.id),
  )
  history.forward()
  await waitFor(() => expect(location.pathname).toBe('/notebook/note'))
  history.back()
  await waitFor(() =>
    expect(new URLSearchParams(location.search).get('id')).toBe(session.id),
  )
  first.unmount()
  render(<StaticLearningShell kind="simulation" />)
  await screen.findByRole('heading', { name: '先回忆，再查看原文' })
  fireEvent.change(screen.getByLabelText('我回忆的表达'), {
    target: { value: 'Unsaved attempt' },
  })
  fireEvent.click(screen.getByRole('link', { name: '返回词句或记录簿' }))
  await screen.findByRole('alertdialog')
  fireEvent.click(screen.getByRole('button', { name: '继续练习' }))
  expect(screen.getByLabelText('我回忆的表达')).toHaveValue('Unsaved attempt')
  fireEvent.click(screen.getByRole('button', { name: '取消本次输入' }))
  expect(screen.getByLabelText('我回忆的表达')).toHaveValue('')
  await waitFor(() =>
    expect(document.documentElement.dataset.interactionBusy).toBeUndefined(),
  )
  expect(
    (await repo.practice.read(session.id))!.session.simulation?.recall,
  ).toBeUndefined()
  expect(await repo.sessions.list()).toHaveLength(1)
})
