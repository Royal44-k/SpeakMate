const guidance =
  '公开语料验证尚未完成。请使用 HTTPS（或本机 localhost）并允许 Service Worker；Safari 请检查网站限制。可返回今日练习，完成并关闭其他窗口后更新，再回来重试。已保存的练习与备份仍可读取。'
type CategoryProof = {
  schemaVersion: 1
  requestId: string
  category: string
  buildId: string
  sha256: string
  bytes: number
}

/** Single-purpose public-data handshake; no learner request/context is sent. */
export async function verifiedCategoryResponse(
  category: string,
  fetcher: typeof fetch,
): Promise<Response> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator))
    throw new Error(guidance)
  const serviceWorker = navigator.serviceWorker
  const abort = new AbortController()
  const disposals: Array<() => void> = []
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await new Promise<Response>((resolve, reject) => {
      let selected: ServiceWorker | undefined
      const fail = () => {
        abort.abort()
        reject(new Error(guidance))
      }
      timer = setTimeout(fail, 10_000)
      const changed = () => {
        if (selected && serviceWorker.controller !== selected) fail()
      }
      serviceWorker.addEventListener('controllerchange', changed)
      disposals.push(() =>
        serviceWorker.removeEventListener('controllerchange', changed),
      )
      const load = async () => {
        const worker =
          serviceWorker.controller ??
          (await new Promise<ServiceWorker>((accept) => {
            const controlled = () => {
              if (serviceWorker.controller) accept(serviceWorker.controller)
            }
            serviceWorker.addEventListener('controllerchange', controlled)
            disposals.push(() =>
              serviceWorker.removeEventListener('controllerchange', controlled),
            )
          }))
        if (abort.signal.aborted) throw new Error(guidance)
        selected = worker
        const requestId = crypto.randomUUID()
        const proof = await new Promise<CategoryProof>((accept) => {
          const receive = (event: MessageEvent) => {
            const value = event.data
            if (
              event.source !== worker ||
              value?.type !== 'CATEGORY_BUILD' ||
              value.schemaVersion !== 1 ||
              value.requestId !== requestId ||
              value.category !== category ||
              typeof value.buildId !== 'string' ||
              !/^[\w-]{1,100}$/.test(value.buildId) ||
              typeof value.sha256 !== 'string' ||
              !/^[a-f0-9]{64}$/.test(value.sha256) ||
              !Number.isSafeInteger(value.bytes) ||
              value.bytes < 1 ||
              value.bytes > 6 * 1024 * 1024
            )
              return
            accept(value)
          }
          serviceWorker.addEventListener('message', receive)
          disposals.push(() =>
            serviceWorker.removeEventListener('message', receive),
          )
          worker.postMessage({
            type: 'CATEGORY_BUILD',
            schemaVersion: 1,
            category,
            requestId,
          })
        })
        if (abort.signal.aborted || serviceWorker.controller !== worker)
          throw new Error(guidance)
        clearTimeout(timer)
        timer = setTimeout(fail, 30_000)
        const path = `/content/v1/${category}`
        const response = await fetcher(path, {
          credentials: 'omit',
          cache: 'no-cache',
          signal: abort.signal,
        })
        if (
          !response.ok ||
          response.headers.get('x-speakmate-build') !== proof.buildId ||
          response.headers.get('x-speakmate-category-sha256') !==
            proof.sha256 ||
          (response.url &&
            response.url !== new URL(path, window.location.origin).href)
        )
          throw new Error(guidance)
        const bytes = await response.clone().arrayBuffer()
        if (bytes.byteLength !== proof.bytes) throw new Error(guidance)
        const hash = [
          ...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
        ]
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('')
        if (
          hash !== proof.sha256 ||
          abort.signal.aborted ||
          serviceWorker.controller !== worker
        )
          throw new Error(guidance)
        return response
      }
      void load().then(resolve, () => reject(new Error(guidance)))
    })
  } finally {
    clearTimeout(timer)
    disposals.forEach((dispose) => dispose())
  }
}
