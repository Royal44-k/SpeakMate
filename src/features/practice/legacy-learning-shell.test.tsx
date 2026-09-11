import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { createIndexedDbRepositories } from '@/infrastructure/persistence/repositories'
import { documentNavigation } from '@/components/app-shell/learning-routes'
import { LegacyLearningShell } from './legacy-learning-shell'
import { StaticLearningShell } from './static-learning-shell'

vi.mock('next/navigation', () => ({
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}))
afterEach(() => vi.restoreAllMocks())

it.each(['level', 'mode', 'round'])(
  'never creates or forwards a new legacy session with empty %s',
  async (option) => {
    const repository = createIndexedDbRepositories()
    await repository.clearLearnerData()
    const replace = vi
      .spyOn(documentNavigation, 'replace')
      .mockImplementation(() => {})
    window.history.replaceState(
      null,
      '',
      `/session/new?scene=coffee-order&${option}=`,
    )
    const legacy = render(<LegacyLearningShell />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '无法恢复',
    )
    expect(screen.getByRole('link', { name: '返回场景库' })).toHaveAttribute(
      'href',
      '/scenes',
    )
    expect(replace).not.toHaveBeenCalled()
    legacy.unmount()
    // The worker parity tests prove this exact invalid marker is its redirect form.
    window.history.replaceState(
      null,
      '',
      '/session?id=new&scene=coffee-order&invalid=1',
    )
    const controlled = render(<StaticLearningShell kind="session" />)
    expect(
      screen.getByRole('heading', { name: '无法打开这个学习入口' }),
    ).toBeVisible()
    expect(await repository.sessions.list()).toHaveLength(0)
    expect((await repository.exportLearnerData()).turns).toHaveLength(0)
    controlled.unmount()
  },
)
