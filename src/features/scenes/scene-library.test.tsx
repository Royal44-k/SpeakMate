import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('SceneLibrary', () => {
  beforeEach(() => {
    navigation.search = ''
    routerReplace.mockReset()
  })

  it('uses the stored profile level when the URL does not provide one', async () => {
    const repositories = createMemoryRepositories()
    const profile = await repositories.profiles.ensureGuestProfile()
    await repositories.profiles.save({ ...profile, level: 'B1' })

    render(<SceneLibraryRoute profileRepository={repositories.profiles} />)

    expect(await screen.findByRole('button', { name: 'B1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText(/当前 B1/)).toBeVisible()
  })

  it('uses a valid URL level instead of the stored profile level', async () => {
    navigation.search = 'level=C1'
    const repositories = createMemoryRepositories()
    const profile = await repositories.profiles.ensureGuestProfile()
    await repositories.profiles.save({ ...profile, level: 'B1' })

    render(<SceneLibraryRoute profileRepository={repositories.profiles} />)

    expect(await screen.findByRole('button', { name: 'C1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText(/当前 C1/)).toBeVisible()
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
})
