import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AuthPanel } from './auth-panel'

describe('AuthPanel release gate', () => {
  it('keeps unfinished cross-device sync hidden unless the feature is explicitly enabled', () => {
    render(<AuthPanel url="https://project.supabase.co" anonKey="public-key" />)

    expect(screen.getByRole('heading', { name: '跨设备同步尚未开放' })).toBeVisible()
    expect(screen.queryByLabelText('邮箱')).not.toBeInTheDocument()
  })
})
