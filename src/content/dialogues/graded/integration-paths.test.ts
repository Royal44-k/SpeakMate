import { describe, expect, it } from 'vitest'
import { GET } from '@/app/content/v1/[category]/route'
import { publicCategorySchema } from '@/content/public-category-schema'
import { CEFR_LEVELS, SCENE_CATEGORIES } from '@/domain/scenes/types'
import {
  createDialogue,
  advanceDialogue,
  dialogueSuggestions,
} from '@/domain/ai/graded-dialogue'
import { selectedPracticePresentation } from '@/content/scenes/practice-presentation'
import { practiceFlow } from '@/domain/practice/graded-evidence'

describe('actual exported whole-corpus path integration, not linguistic proofreading', () => {
  it('validates all units, modes, variants, both slots and alternating choices through the existing local engine', async () => {
    const counts = {
      units: 0,
      questions: 0,
      answers: 0,
      analysisEntries: 0,
      basePaths: 0,
      variantPaths: 0,
      traversals: 0,
      questionsReached: 0,
    }
    const reached = new Set<string>()
    const levelsByScene = new Map<string, Set<string>>()
    for (const category of SCENE_CATEGORIES) {
      const response = await GET(
        new Request('https://local.test/content/v1/' + category),
        { params: Promise.resolve({ category }) },
      )
      const data = publicCategorySchema.parse(await response.json())
      counts.analysisEntries += data.analyses.length
      for (const pack of data.packs) {
        counts.units++
        counts.questions += pack.questions.length
        counts.answers += pack.questions.reduce(
          (n, q) => n + q.answers.length,
          0,
        )
        counts.basePaths += 3
        const forms = levelsByScene.get(pack.sceneId) ?? new Set<string>()
        forms.add(
          JSON.stringify(
            pack.questions.map((q) => [q.text, q.answers.map((a) => a.text)]),
          ),
        )
        levelsByScene.set(pack.sceneId, forms)
        for (const variant of pack.variants) {
          expect(
            selectedPracticePresentation(pack, variant.id).counterpartZh.length,
          ).toBeGreaterThan(0)
          for (const mode of ['short', 'standard', 'extended'] as const) {
            counts.variantPaths++
            const cap = { short: 3, standard: 6, extended: 10 }[mode]
            expect(variant.modes[mode].questionIds).toHaveLength(cap)
            for (const pattern of [0, 1, 2, 3]) {
              counts.traversals++
              let run = createDialogue(pack, { variantId: variant.id, mode })
              const asked = new Set<string>()
              for (let n = 0; run.snapshot.state.outcome === 'active'; n++) {
                expect(n).toBeLessThanOrEqual(cap)
                const id = run.snapshot.state.currentQuestionId!
                expect(
                  asked.has(id),
                  `${pack.sceneId}/${pack.level}/${variant.id}/${mode}/${pattern}/${id}`,
                ).toBe(false)
                asked.add(id)
                reached.add(id)
                const pair = dialogueSuggestions(run.snapshot)
                expect(pair).toHaveLength(2)
                expect(
                  pair.every((a) =>
                    pack.questions
                      .find((q) => q.id === id)!
                      .answers.some((owned) => owned.id === a.id),
                  ),
                ).toBe(true)
                const slot = pattern < 2 ? pattern : (n + pattern) % 2
                run = advanceDialogue(run.snapshot, {
                  action: 'answer',
                  text: pair[slot].text,
                  suggestionId: pair[slot].id,
                })
              }
              expect(run.snapshot.state.outcome).toBe('achieved')
              expect(run.snapshot.state.currentQuestionId).toBeNull()
              expect(dialogueSuggestions(run.snapshot)).toEqual([])
              expect(practiceFlow(run.snapshot).basis).toBeDefined()
            }
          }
        }
      }
    }
    counts.questionsReached = reached.size
    expect(levelsByScene.size).toBe(42)
    expect(
      [...levelsByScene.values()].every(
        (forms) => forms.size === CEFR_LEVELS.length,
      ),
    ).toBe(true)
    expect(counts).toEqual({
      units: 210,
      questions: 2520,
      answers: 5040,
      analysisEntries: 57,
      basePaths: 630,
      variantPaths: 1260,
      traversals: 5040,
      questionsReached: 2520,
    })
    console.info('Task3I actual corpus/path counts', JSON.stringify(counts))
  }, 120_000)
})
