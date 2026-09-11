import { readFileSync } from 'node:fs'
import { createHash, webcrypto } from 'node:crypto'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import {
  canonicalLegacyHref,
  parseLearningTarget,
} from '@/components/app-shell/learning-routes'

function worker() {
  const origin = 'https://speakmate.test'
  const routes: Record<string, string> = {
    '/': 'HOME',
    '/session': 'SESSION',
    '/session/report': 'REPORT',
    '/scenes/prepare': 'PREPARE',
    '/scenes': 'SCENES',
    '/practice': 'PRACTICE',
    '/_next/static/main.js': 'SCRIPT',
    '/_next/static/style.css': '@font-face{src:url(font.woff2)}',
    '/_next/static/font.woff2': 'FONT',
    '/content/v1/dining': '{"category":"dining"}',
  }
  const asset = (url: string) => ({
    url,
    sha256: createHash('sha256').update(routes[url]).digest('hex'),
    bytes: Buffer.byteLength(routes[url]),
  })
  const manifest = {
    schemaVersion: 1,
    buildId: 'build-test',
    shells: Object.keys(routes)
      .filter((x) => !x.startsWith('/_next') && !x.startsWith('/content'))
      .map(asset),
    assets: Object.keys(routes)
      .filter((x) => x.startsWith('/_next'))
      .map(asset),
    categories: [asset('/content/v1/dining')],
  }
  const data = new Map<string, Map<string, Response>>()
  const listeners: Record<string, (event: Record<string, unknown>) => void> = {}
  let offline = false
  let clients = [{ id: 'requester', url: origin + '/practice' }]
  let skipped = false
  const key = (input: string | Request) =>
    new URL(typeof input === 'string' ? input : input.url, origin).href
  const fetcher = async (input: string | Request) => {
    if (offline) throw new Error('offline')
    const url = key(input)
    const path = new URL(url).pathname
    const response = new Response(routes[path] ?? 'OTHER', {
      headers: {
        'content-type': path.includes('/_next/')
          ? path.endsWith('.css')
            ? 'text/css'
            : path.endsWith('.woff2')
              ? 'font/woff2'
              : 'text/javascript'
          : path.startsWith('/content')
            ? 'application/json'
            : 'text/html',
      },
    })
    Object.defineProperty(response, 'url', { value: url })
    return response
  }
  const caches = {
    keys: async () => [...data.keys()],
    delete: async (name: string) => data.delete(name),
    open: async (name: string) => {
      if (!data.has(name)) data.set(name, new Map())
      const rows = data.get(name)!
      return {
        match: async (input: string | Request) => rows.get(key(input))?.clone(),
        put: async (input: string | Request, value: Response) => {
          rows.set(key(input), value.clone())
        },
        addAll: async (inputs: string[]) => {
          for (const input of inputs) rows.set(key(input), await fetcher(input))
        },
      }
    },
    match: async (input: string | Request) => {
      for (const rows of data.values()) {
        const found = rows.get(key(input))
        if (found) return found.clone()
      }
    },
  }
  const self = {
    location: { origin },
    SPEAKMATE_OFFLINE: manifest,
    addEventListener: (name: string, fn: (typeof listeners)[string]) => {
      listeners[name] = fn
    },
    skipWaiting: async () => {
      skipped = true
    },
    clients: { claim: async () => undefined, matchAll: async () => clients },
  }
  runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self,
    caches,
    fetch: fetcher,
    importScripts: () => undefined,
    URL,
    Request,
    Response,
    Headers,
    AbortController,
    setTimeout,
    clearTimeout,
    crypto: webcrypto,
    TextEncoder,
  })
  async function trigger(name: string, event: Record<string, unknown> = {}) {
    let pending: Promise<unknown> | undefined
    listeners[name]({
      ...event,
      waitUntil: (p: Promise<unknown>) => {
        pending = p
      },
      respondWith: (p: Promise<unknown>) => {
        pending = p
      },
    })
    return pending ? await pending : undefined
  }
  return {
    trigger,
    data,
    caches,
    self,
    setOffline: () => {
      offline = true
    },
    setClients: (next: typeof clients) => {
      clients = next
    },
    skipped: () => skipped,
  }
}

describe('document-only offline foundation', () => {
  it.each([
    '/session/new?scene=coffee-order&level=',
    '/session/new?scene=coffee-order&mode=',
    '/session/new?scene=coffee-order&round=',
    '/session/saved?level=',
    '/session/saved?mode=',
    '/session/saved?round=',
    '/scenes/coffee-order?level=',
    '/scenes/coffee-order?mode=',
  ])(
    'matches online recovery for present-empty legacy options: %s',
    async (href) => {
      const w = worker()
      w.setOffline()
      const response = (await w.trigger('fetch', {
        request: {
          url: 'https://speakmate.test' + href,
          method: 'GET',
          mode: 'navigate',
          destination: 'document',
          headers: new Headers(),
        },
      })) as Response
      const location = new URL(response.headers.get('location')!)
      expect(response.status).toBe(302)
      expect(
        parseLearningTarget(location.pathname + location.search).status,
      ).toBe('invalid')
      expect(canonicalLegacyHref(href)).toBeUndefined()
    },
  )
  it('pairs a versioned category/build proof with headers only on its actual verified response', async () => {
    const w = worker()
    const receive = vi.fn()
    await w.trigger('message', {
      data: {
        type: 'CATEGORY_BUILD',
        schemaVersion: 1,
        requestId: 'request-1',
        category: 'dining',
      },
      source: { postMessage: receive },
    })
    expect(receive).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CATEGORY_BUILD',
        schemaVersion: 1,
        requestId: 'request-1',
        category: 'dining',
        buildId: 'build-test',
      }),
    )
    const response = (await w.trigger('fetch', {
      request: {
        url: 'https://speakmate.test/content/v1/dining',
        method: 'GET',
        mode: 'cors',
        destination: '',
        headers: new Headers(),
      },
    })) as Response
    expect(response.headers.get('x-speakmate-build')).toBe('build-test')
    expect(response.headers.get('x-speakmate-category-sha256')).toBe(
      receive.mock.calls[0][0].sha256,
    )
    w.setOffline()
    w.data
      .get('speakmate-build-v1-build-test')!
      .delete('https://speakmate.test/content/v1/dining')
    const unavailable = (await w.trigger('fetch', {
      request: {
        url: 'https://speakmate.test/content/v1/dining',
        method: 'GET',
        mode: 'cors',
        destination: '',
        headers: new Headers(),
      },
    })) as Response
    expect(unavailable.status).toBe(503)
    expect(unavailable.headers.has('x-speakmate-build')).toBe(false)
  })
  it('verifies the persisted activation marker before deleting any prior generation', async () => {
    const w = worker()
    await w.trigger('install')
    w.setClients([])
    const marker = 'https://speakmate.test/.speakmate/offline-activation-v1'
    for (const [id, generation] of [
      ['old', 1],
      ['previous', 2],
    ] as const)
      w.data.set(
        'speakmate-build-v1-' + id,
        new Map([
          [
            marker,
            Response.json({ schemaVersion: 1, buildId: id, generation }),
          ],
        ]),
      )
    const original = w.caches.open
    vi.spyOn(w.caches, 'open').mockImplementation(async (name) => {
      const cache = await original(name)
      return name !== 'speakmate-build-v1-build-test'
        ? cache
        : { ...cache, put: async () => undefined }
    })
    await w.trigger('activate')
    expect(w.data.has('speakmate-build-v1-old')).toBe(true)
  })
  it('keeps all prior resources on a failed marker write or unknown client state', async () => {
    for (const failure of ['marker', 'clients']) {
      const w = worker()
      await w.trigger('install')
      w.setClients([])
      const marker = 'https://speakmate.test/.speakmate/offline-activation-v1'
      for (const [id, generation] of [
        ['old', 1],
        ['previous', 2],
      ] as const)
        w.data.set(
          'speakmate-build-v1-' + id,
          new Map([
            [
              marker,
              Response.json({ schemaVersion: 1, buildId: id, generation }),
            ],
          ]),
        )
      if (failure === 'marker') {
        const original = w.caches.open
        vi.spyOn(w.caches, 'open').mockImplementation(async (name) => {
          const cache = await original(name)
          return name !== 'speakmate-build-v1-build-test'
            ? cache
            : {
                ...cache,
                put: async () => {
                  throw new Error('quota')
                },
              }
        })
      } else
        vi.spyOn(w.self.clients, 'matchAll').mockRejectedValue(
          new Error('unknown'),
        )
      await w.trigger('activate')
      expect(w.data.has('speakmate-build-v1-old')).toBe(true)
    }
  })
  it('reports category readiness only after its exact bytes are cached, independently of shells', async () => {
    const w = worker()
    await w.trigger('install')
    const receive = vi.fn()
    const status = () =>
      w.trigger('message', {
        data: { type: 'OFFLINE_STATUS' },
        source: { postMessage: receive },
      })
    await status()
    expect(receive).toHaveBeenLastCalledWith(
      expect.objectContaining({
        shellReady: true,
        categories: { dining: false },
      }),
    )
    await w.trigger('fetch', {
      request: {
        url: 'https://speakmate.test/content/v1/dining',
        method: 'GET',
        mode: 'cors',
        destination: '',
        headers: new Headers(),
      },
    })
    w.setOffline()
    await status()
    expect(receive).toHaveBeenLastCalledWith(
      expect.objectContaining({
        shellReady: true,
        categories: { dining: true },
      }),
    )
    w.data
      .get('speakmate-build-v1-build-test')!
      .set(
        'https://speakmate.test/content/v1/dining',
        Response.json({ category: 'wrong' }),
      )
    await status()
    expect(receive).toHaveBeenLastCalledWith(
      expect.objectContaining({
        shellReady: true,
        categories: { dining: false },
      }),
    )
  })
  it('preserves the actual last activated build even when a newer install cache was never active', async () => {
    const w = worker()
    await w.trigger('install')
    w.setClients([])
    const marker = 'https://speakmate.test/.speakmate/offline-activation-v1'
    const old = new Map([
      [
        marker,
        Response.json({ schemaVersion: 1, buildId: 'active-A', generation: 2 }),
      ],
      [
        'https://speakmate.test/_next/static/old.js',
        new Response('OLD SCRIPT'),
      ],
    ])
    w.data.set(
      'speakmate-build-v1-obsolete',
      new Map([
        [
          marker,
          Response.json({
            schemaVersion: 1,
            buildId: 'obsolete',
            generation: 1,
          }),
        ],
      ]),
    )
    w.data.set('speakmate-build-v1-active-A', old)
    w.data.set('speakmate-build-v1-never-activated-B', new Map())
    await w.trigger('activate')
    w.setOffline()
    expect(w.data.has('speakmate-build-v1-active-A')).toBe(true)
    expect(w.data.has('speakmate-build-v1-obsolete')).toBe(false)
    expect(w.data.has('speakmate-build-v1-never-activated-B')).toBe(true)
    const response = (await w.trigger('fetch', {
      request: {
        url: 'https://speakmate.test/_next/static/old.js',
        method: 'GET',
        mode: 'cors',
        destination: 'script',
        headers: new Headers(),
      },
    })) as Response
    expect(await response.text()).toBe('OLD SCRIPT')
  })
  it('does not clean prior resources when a new window races the manual activation check', async () => {
    const w = worker()
    await w.trigger('install')
    w.data.set('speakmate-build-v1-oldest', new Map())
    w.data.set('speakmate-build-v1-previous', new Map())
    await w.trigger('message', {
      data: { type: 'SKIP_WAITING' },
      source: { id: 'requester', postMessage: () => undefined },
    })
    expect(w.skipped()).toBe(true)
    w.setClients([
      { id: 'requester', url: 'https://speakmate.test/practice' },
      { id: 'arrived', url: 'https://speakmate.test/session?id=old' },
    ])
    await w.trigger('activate')
    expect(w.data.has('speakmate-build-v1-oldest')).toBe(true)
    expect(w.data.has('speakmate-build-v1-previous')).toBe(true)
  })
  it('keeps legacy2.3 and unknown metadata rather than deleting on an assumed generation', async () => {
    const w = worker()
    await w.trigger('install')
    w.setClients([])
    w.data.set('speakmate-v2.3.0-shell-r1', new Map())
    w.data.set(
      'speakmate-build-v1-unknown',
      new Map([
        [
          'https://speakmate.test/.speakmate/offline-activation-v1',
          Response.json({ schemaVersion: 99 }),
        ],
      ]),
    )
    await w.trigger('activate')
    expect(w.data.has('speakmate-v2.3.0-shell-r1')).toBe(true)
    expect(w.data.has('speakmate-build-v1-unknown')).toBe(true)
  })
  it('forwards a legacy report to its exact shell with clean source and never a new session', async () => {
    const w = worker()
    await w.trigger('install')
    w.setOffline()
    const response = (await w.trigger('fetch', {
      request: {
        url: 'https://speakmate.test/session/A/report?from=%2Fscenes%3Flevel%3DC1%26q%3Dprivate',
        method: 'GET',
        mode: 'navigate',
        destination: 'document',
        headers: new Headers(),
      },
    })) as Response
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe(
      'https://speakmate.test/session/report?id=A&from=%2Fscenes%3Flevel%3DC1',
    )
  })
  it('serves the matching report shell for an unseen ID, never another route HTML', async () => {
    const w = worker()
    await w.trigger('install')
    w.setOffline()
    const response = (await w.trigger('fetch', {
      request: {
        url: 'https://speakmate.test/session/report?id=unseen',
        method: 'GET',
        mode: 'navigate',
        destination: 'document',
        headers: new Headers(),
      },
    })) as Response
    expect(await response.text()).toBe('REPORT')
  })
  it('prepares transitive static/font resources declared by the production build', async () => {
    const w = worker()
    await w.trigger('install')
    expect(
      [...w.data.values()].some((rows) =>
        rows.has('https://speakmate.test/_next/static/font.woff2'),
      ),
    ).toBe(true)
    expect(
      [...w.data.values()].some((rows) =>
        rows.has('https://speakmate.test/content/v1/dining'),
      ),
    ).toBe(false)
  })
  it('never supplies document HTML to a RSC or prefetch request', async () => {
    const w = worker()
    await w.trigger('install')
    w.setOffline()
    expect(
      await w.trigger('fetch', {
        request: {
          url: 'https://speakmate.test/session/report?id=A&_rsc=1',
          method: 'GET',
          mode: 'navigate',
          destination: '',
          headers: new Headers({ RSC: '1' }),
        },
      }),
    ).toBeUndefined()
  })
  it('defers explicit activation when another idle window can later need old chunks', async () => {
    const w = worker()
    w.setClients([
      { id: 'requester', url: 'https://speakmate.test/practice' },
      { id: 'older', url: 'https://speakmate.test/scenes' },
    ])
    await w.trigger('message', {
      data: { type: 'SKIP_WAITING' },
      source: { id: 'requester', postMessage: () => undefined },
    })
    expect(w.skipped()).toBe(false)
  })
  it('never deletes another application cache on activation', async () => {
    const w = worker()
    w.data.set('unrelated-cache', new Map())
    await w.trigger('activate')
    expect(w.data.has('unrelated-cache')).toBe(true)
  })
})
