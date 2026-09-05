import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LearnerProfile } from '@/domain/learning/types'
import type { ProfileRepository } from '@/infrastructure/persistence/repositories'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'

import { SceneLibraryRoute } from './scene-library-route'
import { SceneLibrary } from './scene-library'

const initialState = {
  search: '',
  category: 'all' as const,
  level: 'A2' as const,
  duration: 'all' as const,
}

const { navigation, routerReplace } = vi.hoisted(() => ({
  navigation: { search: '' },
  routerReplace: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: routerReplace }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}))

function profile(level: LearnerProfile['level']): LearnerProfile {
  return {
    id: 'guest_test',
    level,
    goals: ['travel'],
    dailyMinutes: 5,
    onboardingCompleted: true,
    createdAt: '2026-09-05T00:00:00.000Z',
    updatedAt: '2026-09-05T00:00:00.000Z',
  }
}

async function renderRoute(level: LearnerProfile['level'] = 'B1') {
  const repositories = createMemoryRepositories()
  const saved = await repositories.profiles.ensureGuestProfile()
  await repositories.profiles.save({ ...saved, level })

  return render(<SceneLibraryRoute profileRepository={repositories.profiles} />)
}

async function renderReadyRoute(level: LearnerProfile['level'] = 'B1') {
  const view = await renderRoute(level)
  await act(async () => undefined)
  expect(screen.getByText(`个匹配场景 · 当前 ${level}`)).toBeVisible()
  return view
}

describe('SceneLibrary', () => {
  beforeEach(() => {
    navigation.search = ''
    routerReplace.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('holds an aria-busy skeleton without A2 until the saved profile resolves', async () => {
    let resolveProfile: (value: LearnerProfile) => void = () => undefined
    const profileRepository: ProfileRepository = {
      get: vi.fn(),
      ensureGuestProfile: vi.fn(
        () =>
          new Promise<LearnerProfile>((resolve) => (resolveProfile = resolve)),
      ),
      save: vi.fn(),
    }

    render(<SceneLibraryRoute profileRepository={profileRepository} />)

    expect(screen.getByRole('main', { name: '场景库加载中' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.queryByText(/当前 A2/)).not.toBeInTheDocument()
    expect(profileRepository.ensureGuestProfile).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveProfile(profile('B1'))
    })

    expect(await screen.findByRole('button', { name: 'B1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText(/当前 B1/)).toBeVisible()
  })

  it('renders a valid URL level immediately without reading the profile', () => {
    navigation.search = 'level=C1'
    const profileRepository: ProfileRepository = {
      get: vi.fn(),
      ensureGuestProfile: vi.fn(),
      save: vi.fn(),
    }

    render(<SceneLibraryRoute profileRepository={profileRepository} />)

    expect(screen.getByRole('button', { name: 'C1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText(/当前 C1/)).toBeVisible()
    expect(
      screen.queryByRole('main', { name: '场景库加载中' }),
    ).not.toBeInTheDocument()
    expect(profileRepository.ensureGuestProfile).not.toHaveBeenCalled()
  })

  it('falls back to the saved profile level for an invalid URL level', async () => {
    navigation.search = 'level=Z9'
    const repositories = createMemoryRepositories()
    const saved = await repositories.profiles.ensureGuestProfile()
    await repositories.profiles.save({ ...saved, level: 'B2' })

    render(<SceneLibraryRoute profileRepository={repositories.profiles} />)

    expect(screen.getByRole('main', { name: '场景库加载中' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(await screen.findByText(/当前 B2/)).toBeVisible()
  })

  it('debounces search URL writes for 250 ms', async () => {
    vi.useFakeTimers()
    await renderReadyRoute()

    fireEvent.change(screen.getByLabelText('搜索场景'), {
      target: { value: 'hotel' },
    })
    expect(routerReplace).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(249)
    })
    expect(routerReplace).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(routerReplace).toHaveBeenCalledWith('/scenes?q=hotel&level=B1', {
      scroll: false,
    })
  })

  it('writes only the latest search after continuous input', async () => {
    vi.useFakeTimers()
    await renderReadyRoute()

    fireEvent.change(screen.getByLabelText('搜索场景'), {
      target: { value: 'hot' },
    })
    fireEvent.change(screen.getByLabelText('搜索场景'), {
      target: { value: 'hotel' },
    })

    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    expect(routerReplace).toHaveBeenCalledTimes(1)
    expect(routerReplace).toHaveBeenCalledWith('/scenes?q=hotel&level=B1', {
      scroll: false,
    })
  })

  it('writes filters immediately and cancels a pending search write', async () => {
    vi.useFakeTimers()
    await renderReadyRoute()

    fireEvent.change(screen.getByLabelText('搜索场景'), {
      target: { value: 'hotel' },
    })
    fireEvent.click(screen.getByRole('button', { name: '社交' }))

    expect(routerReplace).toHaveBeenCalledTimes(1)
    expect(routerReplace).toHaveBeenCalledWith(
      '/scenes?q=hotel&category=social&level=B1',
      { scroll: false },
    )

    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    expect(routerReplace).toHaveBeenCalledTimes(1)
  })

  it('cancels a pending search URL write when unmounted', async () => {
    vi.useFakeTimers()
    const view = await renderReadyRoute()

    fireEvent.change(screen.getByLabelText('搜索场景'), {
      target: { value: 'hotel' },
    })
    view.unmount()

    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    expect(routerReplace).not.toHaveBeenCalled()
  })

  it('searches bilingual titles and filters by category', () => {
    render(<SceneLibrary initialState={{ ...initialState, level: 'B1' }} />)

    expect(screen.getByText('42 个真实对话场景')).toBeVisible()
    fireEvent.change(screen.getByLabelText('搜索场景'), {
      target: { value: 'hotel' },
    })
    expect(screen.getByText('Hotel check-in')).toBeVisible()
    expect(screen.queryByText('Daily stand-up')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('搜索场景'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: '职场' }))
    expect(screen.getAllByTestId('scene-card')).toHaveLength(6)
  })

  it('adapts visible language support when the CEFR filter changes', () => {
    render(<SceneLibrary initialState={{ ...initialState, level: 'A1' }} />)

    fireEvent.click(screen.getByRole('button', { name: 'C1' }))
    expect(screen.getByText('C1')).toBeVisible()
    expect(screen.getAllByTestId('scene-card')[0]).toHaveTextContent(
      '5 个关键词',
    )
  })

  it('filters scenes by estimated practice duration', () => {
    render(<SceneLibrary initialState={initialState} />)

    fireEvent.click(screen.getByRole('button', { name: '3 分钟' }))

    expect(screen.getAllByTestId('scene-card')).toHaveLength(7)
    screen.getAllByTestId('scene-card').forEach((card) => {
      expect(card).toHaveTextContent('3 分钟')
    })
  })

  it('emits complete current state with the source of each filter change', () => {
    const onStateChange = vi.fn()
    render(
      <SceneLibrary
        initialState={{ ...initialState, level: 'B1' }}
        onStateChange={onStateChange}
      />,
    )

    fireEvent.change(screen.getByLabelText('搜索场景'), {
      target: { value: 'hotel' },
    })
    expect(onStateChange).toHaveBeenLastCalledWith(
      { search: 'hotel', category: 'all', level: 'B1', duration: 'all' },
      'search',
    )

    fireEvent.click(screen.getByRole('button', { name: '社交' }))
    expect(onStateChange).toHaveBeenLastCalledWith(
      { search: 'hotel', category: 'social', level: 'B1', duration: 'all' },
      'filter',
    )

    fireEvent.click(screen.getByRole('button', { name: '5 分钟' }))
    expect(onStateChange).toHaveBeenLastCalledWith(
      { search: 'hotel', category: 'social', level: 'B1', duration: 5 },
      'filter',
    )
  })
})
