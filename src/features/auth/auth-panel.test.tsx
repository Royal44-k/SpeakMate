import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AuthPanel } from './auth-panel'

describe('AuthPanel release gate', () => {
  it('keeps cross-device sync hidden in the strict-local release', () => {
    render(<AuthPanel url="https://project.supabase.co" anonKey="public-key" />)

    expect(screen.getByRole('heading', { name: '仅保存在本机' })).toBeVisible()
    expect(screen.queryByLabelText('邮箱')).not.toBeInTheDocument()
  })

  it('keeps the future adapter dormant even when old cloud settings remain', () => {
    render(
      <AuthPanel
        enabled
        url="https://project.supabase.co"
        anonKey="public-key"
      />,
    )

    expect(screen.getByRole('heading', { name: '仅保存在本机' })).toBeVisible()
    expect(screen.queryByLabelText('邮箱')).not.toBeInTheDocument()
  })
})
