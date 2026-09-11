import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ScenePage from './page'
const navigation = vi.hoisted(() => ({
  search: new URLSearchParams(),
  replace: vi.fn(),
}))
vi.mock('@/components/app-shell/learning-routes', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  documentNavigation: { replace: navigation.replace },
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/scenes/first-small-talk',
  useSearchParams: () => navigation.search,
}))

async function renderPage({
  level,
  from,
}: {
  level: string
  from?: string | string[]
}) {
  navigation.search = new URLSearchParams({ level })
  for (const value of from === undefined
    ? []
    : Array.isArray(from)
      ? from
      : [from])
    navigation.search.append('from', value)
  render(<ScenePage />)
}

describe('scene detail page return route', () => {
  it('shows recovery instead of forwarding a present-empty level', async () => {
    navigation.replace.mockClear()
    await renderPage({ level: '' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '无法恢复',
    )
    expect(
      screen.queryByRole('link', { name: '继续打开' }),
    ).not.toBeInTheDocument()
    expect(navigation.replace).not.toHaveBeenCalled()
  })
  it('preserves a scene-library source including its filter query', async () => {
    await renderPage({
      level: 'B1',
      from: '/scenes?category=social&level=B1&duration=5',
    })

    expect(screen.getByRole('link', { name: '继续打开' })).toHaveAttribute(
      'href',
      '/scenes/prepare?scene=first-small-talk&level=B1&from=%2Fscenes%3Flevel%3DB1%26category%3Dsocial%26duration%3D5',
    )
  })

  it.each([
    {
      name: 'an external URL',
      level: 'B1',
      from: 'https://example.com/scenes',
      expected: '',
    },
    {
      name: 'a non-scene app route',
      level: 'C1',
      from: '/practice?level=C1',
      expected: '&from=%2Fpractice%3Flevel%3DC1',
    },
    {
      name: 'a lookalike scene prefix',
      level: 'B1',
      from: '/scenes-bogus?category=social',
      expected: '',
    },
    {
      name: 'an array value',
      level: 'B2',
      from: ['/scenes?level=A1', '/scenes?level=B2'],
      expected: '',
    },
    {
      name: 'a missing value',
      level: 'A1',
      from: undefined,
      expected: '',
    },
  ])('falls back safely for $name', async ({ level, from, expected }) => {
    await renderPage({ level, from })

    if (Array.isArray(from)) {
      expect(screen.getByRole('link', { name: '返回场景库' })).toHaveAttribute(
        'href',
        '/scenes',
      )
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        '无法恢复',
      )
      return
    }

    expect(screen.getByRole('link', { name: '继续打开' })).toHaveAttribute(
      'href',
      `/scenes/prepare?scene=first-small-talk&level=${level}${expected}`,
    )
  })
})
