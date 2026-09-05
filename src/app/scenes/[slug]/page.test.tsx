import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ScenePage from './page'

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('not found')
  }),
  useRouter: () => ({ back: vi.fn() }),
}))

async function renderPage({
  level,
  from,
}: {
  level: string
  from?: string | string[]
}) {
  const page = await ScenePage({
    params: Promise.resolve({ slug: 'first-small-talk' }),
    searchParams: Promise.resolve(
      from === undefined ? { level } : { level, from },
    ),
  })

  render(page)
}

describe('scene detail page return route', () => {
  it('preserves a scene-library source including its filter query', async () => {
    await renderPage({
      level: 'B1',
      from: '/scenes?category=social&level=B1&duration=5',
    })

    expect(screen.getByRole('link', { name: '返回初次寒暄' })).toHaveAttribute(
      'href',
      '/scenes?category=social&level=B1&duration=5',
    )
  })

  it.each([
    {
      name: 'an external URL',
      level: 'B1',
      from: 'https://example.com/scenes',
      expected: '/scenes?level=B1',
    },
    {
      name: 'a non-scene app route',
      level: 'C1',
      from: '/practice?level=C1',
      expected: '/scenes?level=C1',
    },
    {
      name: 'an array value',
      level: 'B2',
      from: ['/scenes?level=A1', '/scenes?level=B2'],
      expected: '/scenes?level=B2',
    },
    {
      name: 'a missing value',
      level: 'A1',
      from: undefined,
      expected: '/scenes?level=A1',
    },
  ])('falls back safely for $name', async ({ level, from, expected }) => {
    await renderPage({ level, from })

    expect(screen.getByRole('link', { name: '返回初次寒暄' })).toHaveAttribute(
      'href',
      expected,
    )
  })
})
