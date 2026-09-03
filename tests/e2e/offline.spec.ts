import { expect, test } from '@playwright/test'

test('service worker shell contains the privacy-safe offline routes', async ({ request }) => {
  const response = await request.get('/sw.js')
  const source = await response.text()
  expect(source).toContain("['/', '/install', '/manifest.webmanifest']")
  expect(source).toContain("url.pathname.startsWith('/api/')")
  expect(source).toContain("request.destination === 'audio'")
})
