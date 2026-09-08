const SHELL_CACHE = 'speakmate-v2.2.0-shell-r2'
const STATIC_ROUTES = [
  '/',
  '/install',
  '/scenes',
  '/offline/session',
  '/manifest.webmanifest',
]

function isOfflineShellRoute(pathname) {
  return STATIC_ROUTES.includes(pathname) || pathname.startsWith('/scenes/')
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell())
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname === '/auth' ||
    url.pathname.startsWith('/auth/') ||
    request.destination === 'audio'
  ) {
    return
  }

  if (request.mode === 'navigate') {
    if (url.pathname.startsWith('/session/')) {
      event.respondWith(networkFirst(request, '/offline/session', false))
    } else if (isOfflineShellRoute(url.pathname)) {
      event.respondWith(networkFirst(request))
    }
    return
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(cacheFirst(request))
    return
  }
})

async function networkFirst(request, fallbackPath = '/', cacheResponse = true) {
  const cache = await caches.open(SHELL_CACHE)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3_000)
  try {
    const response = await fetch(request, { signal: controller.signal })
    if (response.ok && cacheResponse) await cache.put(request, response.clone())
    return response
  } catch {
    return (await cache.match(request)) ?? (await cache.match(fallbackPath))
  } finally {
    clearTimeout(timeout)
  }
}

async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE)
  await cache.addAll(STATIC_ROUTES)
  const documents = await Promise.all(
    STATIC_ROUTES.filter((path) => path !== '/manifest.webmanifest').map(
      (path) => cache.match(path),
    ),
  )
  const assets = new Set()
  for (const response of documents) {
    if (!response) continue
    const html = await response.text()
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const path = match[1]
      if (path.startsWith('/_next/static/') || path.startsWith('/icons/')) {
        assets.add(path)
      }
    }
  }
  if (assets.size > 0) await cache.addAll([...assets])
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(SHELL_CACHE)
    await cache.put(request, response.clone())
  }
  return response
}
