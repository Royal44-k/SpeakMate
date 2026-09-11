import { describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/content/v1/[category]/route'
import {
  publicContentProvider,
  publicLearningAssistant,
} from './public-category'
import { publicCategorySchema } from './public-category-schema'

describe('finite public category content boundary', () => {
  it('rejects truncated analysis inventories and cross-scene question context', async () => {
    const response = await GET(
      new Request('https://local.test/content/v1/dining'),
      { params: Promise.resolve({ category: 'dining' }) },
    )
    const data = await response.json()
    expect(data.analyses).toHaveLength(21)
    expect(
      publicCategorySchema.safeParse({
        ...data,
        analyses: data.analyses.slice(0, 6),
      }).success,
    ).toBe(false)
    const wrong = structuredClone(data)
    wrong.analyses[0].questionIds = ['restaurant-order.A1.meal']
    expect(publicCategorySchema.safeParse(wrong).success).toBe(false)
  })
  it('analyzes the contextual workplace sentence locally using only its fixed public category download', async () => {
    const response = await GET(
      new Request('https://local.test/content/v1/work'),
      { params: Promise.resolve({ category: 'work' }) },
    )
    const fetcher = vi.fn<typeof fetch>(async () => response.clone())
    const assistant = publicLearningAssistant(fetcher)
    const request = {
      sceneId: 'work-05',
      level: 'C1' as const,
      kind: 'sentence' as const,
      text: 'Could we test that assumption?',
    }
    expect((await assistant.analyze(request)).status).not.toBe('exact')
    expect(
      (
        await assistant.analyze({
          ...request,
          questionId: 'meeting-disagreement.C1.assumption',
        })
      ).status,
    ).toBe('exact')
    const unknown = await assistant.analyze({
      ...request,
      text: 'PRIVATE uncollected personal note 123',
    })
    expect(unknown.status).toBe('unknown')
    expect(unknown.originalText).toBe('PRIVATE uncollected personal note 123')
    expect(
      fetcher.mock.calls.every(
        (args) =>
          args.length === 2 &&
          args[0] === '/content/v1/work' &&
          JSON.stringify(args[1]) ===
            JSON.stringify({ credentials: 'omit', cache: 'no-cache' }),
      ),
    ).toBe(true)
    const missing = publicLearningAssistant(
      async () => new Response('offline', { status: 503 }),
    )
    await expect(missing.analyze(request)).rejects.toThrow('尚未下载')
  })
  it.each([
    'travel',
    'dining',
    'daily',
    'work',
    'social',
    'study',
    'emergency',
  ])(
    'exports the reviewed %s values without learner processing',
    async (category) => {
      const response = await GET(
        new Request('https://local.test/content/v1/' + category),
        { params: Promise.resolve({ category }) },
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.packs).toHaveLength(30)
      expect(
        data.packs.flatMap((pack: { questions: unknown[] }) => pack.questions),
      ).toHaveLength(360)
      expect(data.category).toBe(category)
    },
  )
  it('loads only a fixed public category URL and rejects missing or wrong-version data', async () => {
    const response = await GET(
      new Request('https://local.test/content/v1/dining'),
      { params: Promise.resolve({ category: 'dining' }) },
    )
    const fetcher = vi.fn(async () => response.clone())
    const provider = publicContentProvider(fetcher)
    const selected = await provider.load({ sceneId: 'dining-01', level: 'C1' })
    expect(selected.status).toBe('available')
    expect(fetcher).toHaveBeenCalledWith('/content/v1/dining', {
      credentials: 'omit',
      cache: 'no-cache',
    })
    expect(
      await provider.load({
        sceneId: 'dining-01',
        level: 'A1',
        contentVersion: 9,
      }),
    ).toEqual({ status: 'version-unavailable', requestedVersion: 9 })
    const wrong = publicContentProvider(async () =>
      Response.json({ schemaVersion: 2 }),
    )
    await expect(
      wrong.load({ sceneId: 'dining-01', level: 'C1' }),
    ).rejects.toThrow()
  })
})
