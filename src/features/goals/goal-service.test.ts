import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createMemoryRepositories,
  createIndexedDbRepositories,
} from '@/infrastructure/persistence/repositories'
import { deleteDatabase } from '@/infrastructure/persistence/db'
import {
  goalFixture,
  goalAt,
  simulationCandidate,
} from '@/infrastructure/persistence/goal-fixtures'
import { GET } from '@/app/content/v1/[category]/route'
import { createGoalService } from './goal-service'

const fetcher: typeof fetch = async (input) =>
  GET(new Request('https://local.test' + String(input)), {
    params: Promise.resolve({ category: String(input).split('/').at(-1)! }),
  })
afterEach(async () => {
  vi.restoreAllMocks()
  await deleteDatabase()
})
describe.each([
  ['memory', createMemoryRepositories],
  ['indexeddb', createIndexedDbRepositories],
] as const)('%s fixed-target recovery service', (_, make) => {
  it('forgets a successful create command, but retries the identical new command after a failed continuation write', async () => {
    const repo = make(),
      { plan } = await goalFixture(repo)
    let tick = 20
    const service = createGoalService(repo, fetcher, () => goalAt(tick++))
    await service.launchScene(plan, plan.tasks[1])
    const first = (await repo.sessions.list())[0]
    await repo.practice.commit({
      kind: 'stop',
      expected: first,
      at: goalAt(21),
    })
    const current = (await service.load(plan.dateKey)).plan
    const calls: string[] = []
    const realCommit = repo.practice.commit
    let fail = true
    vi.spyOn(repo.practice, 'commit').mockImplementation(async (request) => {
      if (request.kind === 'create') {
        calls.push(request.session.id)
        if (fail) {
          fail = false
          throw Error('continuation write failed')
        }
      }
      return realCommit(request)
    })
    await expect(
      service.launchScene(current, current.tasks[1]),
    ).rejects.toThrow('continuation write failed')
    expect(await repo.sessions.list()).toHaveLength(1)
    await service.launchScene(current, current.tasks[1])
    expect(calls).toHaveLength(2)
    expect(calls[0]).toBe(calls[1])
    expect(calls[0]).not.toBe(first.id)
    expect(await repo.sessions.list()).toHaveLength(2)
    expect(
      await repo.learning.getDailyPlan(plan.profileId, plan.dateKey),
    ).toEqual(current)
    expect(await repo.learning.balance(plan.profileId)).toBe(0)
  })
  it('keeps a stopped simulation fixed and unawarded when its original material cannot be fetched', async () => {
    const repo = make(),
      { plan } = await goalFixture(repo)
    const { session, material } = await simulationCandidate(repo, plan)
    await repo.practice.commit({
      kind: 'create',
      session,
      simulationMaterial: material,
      taskLaunch: { planId: plan.id, taskId: plan.tasks[2].id },
    })
    await repo.practice.commit({
      kind: 'stop',
      expected: session,
      at: goalAt(21),
    })
    const current = (await repo.learning.getDailyPlan(
      plan.profileId,
      plan.dateKey,
    ))!
    const before = await repo.exportLearnerData()
    const service = createGoalService(
      repo,
      async () => new Response('offline', { status: 503 }),
      () => goalAt(22),
    )
    await expect(
      service.launchScene(current, current.tasks[2]),
    ).rejects.toThrow()
    const after = await repo.exportLearnerData()
    expect({ ...after, exportedAt: before.exportedAt }).toEqual(before)
  })
})
