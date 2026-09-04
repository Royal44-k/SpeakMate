import { describe, expect, it } from 'vitest'

import nextConfig from '../../next.config'

describe('security headers', () => {
  it('ships a restrictive content security policy for the PWA', async () => {
    const rules = await nextConfig.headers!()
    const globalRule = rules.find((rule) => rule.source === '/(.*)')
    const csp = globalRule?.headers.find((header) => header.key === 'Content-Security-Policy')?.value

    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("connect-src 'self'")
    expect(csp).toContain("media-src 'self' blob:")
    expect(csp).toContain("worker-src 'self' blob:")
    expect(csp).toContain("form-action 'self'")
  })
})
