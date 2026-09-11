import { expect, it, vi } from 'vitest'
import { GET } from '@/app/content/v1/[category]/route'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { newSimulation, simulationOptions } from './simulation-material'
import { publicCategorySchema } from '@/content/public-category-schema'
it.each([
  ['on the side', 'phrase', 'A1'],
  ['on the side', 'phrase', 'A2'],
  ['No chilli, please.', 'sentence', 'B1'],
  ['No chilli, please.', 'sentence', 'B2'],
  ['No chilli, please.', 'sentence', 'C1'],
] as const)(
  'creates reviewed v2 for %s/%s/%s and rejects a legacy new creation',
  async (text, kind, level) => {
    const repo = createMemoryRepositories()
    const profile = await repo.profiles.ensureGuestProfile()
    const source = {
      id: 'source',
      kind: 'turn' as const,
      originalText: text,
      sceneId: 'dining-02',
      level,
      createdAt: new Date().toISOString(),
    }
    const note = await repo.notebook.save({
      id: 'note',
      profileId: profile.id,
      text,
      kind,
      normalizedText: '',
      notes: '',
      tags: [],
      favoriteIds: [],
      sources: [source],
      createdAt: source.createdAt,
      updatedAt: source.createdAt,
    })
    const fetcher = vi.fn<typeof fetch>(async () =>
      GET(new Request('https://local.test'), {
        params: Promise.resolve({ category: 'dining' }),
      }),
    )
    const [option] = await simulationOptions(note, source, fetcher)
    expect(option.descriptor.version).toBe(2)
    if (option.descriptor.version !== 2) throw Error('fixture')
    const { targetQuestionOverride: _override, ...fields } = option.descriptor
    expect(_override.id).toBe(`restaurant-order.${level}.chilli`)
    const legacyOption = {
      ...option,
      descriptor: { ...fields, version: 1 as const },
    }
    const legacy = newSimulation(note, source, legacyOption)
    await expect(
      repo.practice.commit({
        kind: 'create',
        session: legacy,
        simulationMaterial: legacyOption,
      }),
    ).rejects.toThrow('SIMULATION_SOURCE')
    const candidate = newSimulation(note, source, option)
    const mismatched = { ...candidate, gradedDialogue: legacy.gradedDialogue }
    await expect(
      repo.practice.commit({
        kind: 'create',
        session: mismatched,
        simulationMaterial: option,
      }),
    ).rejects.toThrow()
    await expect(
      repo.practice.commit({
        kind: 'create',
        session: candidate,
        simulationMaterial: legacyOption,
      }),
    ).rejects.toThrow('SIMULATION_SOURCE')
    const saved = await repo.practice.commit({
      kind: 'create',
      session: candidate,
      simulationMaterial: option,
    })
    expect(saved.record.session.simulation!.descriptor).toEqual(
      option.descriptor,
    )
    expect(saved.record.session.gradedDialogue!.pack.questions.at(-1)).toEqual(
      option.descriptor.targetQuestionOverride,
    )
    expect(
      fetcher.mock.calls.every((call) => call[0] === '/content/v1/dining'),
    ).toBe(true)
    expect(
      publicCategorySchema.safeParse(
        await (await fetcher('/content/v1/dining')).json(),
      ).success,
    ).toBe(true)
  },
)
it('pins only an explicitly covered word in a partial original and refuses unknown or missing context without inventing content', async () => {
  const repo = createMemoryRepositories()
  const profile = await repo.profiles.ensureGuestProfile()
  const source = {
    id: 'source',
    kind: 'turn' as const,
    originalText: 'This blocker perplexes my purple rabbit.',
    sceneId: 'work-02',
    level: 'C1' as const,
    createdAt: '2026-09-11T00:00:00.000Z',
  }
  const note = await repo.notebook.save({
    id: 'partial-note',
    profileId: profile.id,
    kind: 'sentence',
    text: source.originalText,
    normalizedText: '',
    notes: '',
    tags: [],
    favoriteIds: [],
    sources: [source],
    createdAt: source.createdAt,
    updatedAt: source.createdAt,
  })
  const fetcher = vi.fn<typeof fetch>(async () =>
    GET(new Request('https://local.test'), {
      params: Promise.resolve({ category: 'work' }),
    }),
  )
  const options = await simulationOptions(note, source, fetcher)
  expect(options).toHaveLength(1)
  expect(options[0].target).toMatchObject({
    coverage: 'partial',
    text: 'blocker',
    kind: 'word',
  })
  const candidate = newSimulation(note, source, options[0])
  const saved = await repo.practice.commit({
    kind: 'create',
    session: candidate,
    simulationMaterial: options[0],
  })
  expect(saved.record.session.simulation?.source.noteText).toBe(
    source.originalText,
  )
  expect(saved.record.session.simulation?.target.text).toBe('blocker')
  const altered = await repo.exportLearnerData()
  altered.sessions[0].simulation!.target.text = 'unrelatedword'
  await expect(repo.previewRestore(JSON.stringify(altered))).rejects.toThrow()
  expect(
    await simulationOptions(
      { ...note, text: 'Rainbow unicorn quasar' },
      source,
      fetcher,
    ),
  ).toEqual([])
  const calls = fetcher.mock.calls.length
  expect(await simulationOptions(note, undefined, fetcher)).toEqual([])
  expect(fetcher).toHaveBeenCalledTimes(calls)
  await expect(
    simulationOptions(note, source, async () => {
      throw Error('not ready')
    }),
  ).rejects.toThrow('not ready')
  expect((await repo.exportLearnerData()).learningEvents).toEqual([])
})
