import { expect, it, vi } from 'vitest'
import { GET } from '@/app/content/v1/[category]/route'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { newSimulation, simulationOptions } from './simulation-material'
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
