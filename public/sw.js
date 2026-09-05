const SHELL_CACHE = 'speakmate-shell-v2.1.0'
const STATIC_ROUTES = ['/', '/install', '/scenes', '/manifest.webmanifest']

function isOfflineShellRoute(pathname) {
  return (
    STATIC_ROUTES.includes(pathname) ||
    pathname.startsWith('/scenes/') ||
    pathname.startsWith('/session/')
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(STATIC_ROUTES)),
  )
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
    if (isOfflineShellRoute(url.pathname)) {
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

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3_000)
  try {
    const response = await fetch(request, { signal: controller.signal })
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch {
    return (await cache.match(request)) ?? (await cache.match('/'))
  } finally {
    clearTimeout(timeout)
  }
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
