const SHELL_CACHE = 'speakmate-shell-v1'
const STATIC_ROUTES = ['/', '/install', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(STATIC_ROUTES)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key)),
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
    url.pathname.startsWith('/auth/') ||
    request.destination === 'audio'
  ) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(staleWhileRevalidate(request))
})

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch {
    return (await cache.match(request)) ?? (await cache.match('/'))
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

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE)
  const cached = await cache.match(request)
  const fresh = fetch(request).then((response) => {
    if (response.ok) void cache.put(request, response.clone())
    return response
  })
  return cached ?? fresh
}
