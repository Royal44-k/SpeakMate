import type {
  NotebookEntry,
  NotebookSourceSnapshot,
} from '@/domain/notebook/types'
import type { PracticeSession } from '@/domain/practice/types'
import { loadPublicCategory } from '@/content/public-category'
import { gradedSceneManifest } from '@/content/dialogues/graded/manifest'
import { normalizeAcceptedForm } from '@/content/dialogues/graded/schema'
import { matchAuthoredAnalysis } from '@/content/analysis/match-authored-analysis'
import { projectMicroPractice } from '@/content/micro-practice'
import { createDialogue } from '@/domain/ai/graded-dialogue'
import { selectedPracticePresentation } from '@/content/scenes/practice-presentation'
import { savedNotebookHref } from '@/components/app-shell/learning-routes'

/** Only the fixed public category is downloaded. Note text never leaves this device. */
export async function simulationOptions(
  note: NotebookEntry,
  source: NotebookSourceSnapshot | undefined,
  fetcher: typeof fetch = fetch,
) {
  const scene = gradedSceneManifest.find(
    (scene) => scene.sceneId === source?.sceneId,
  )
  if (!scene || !source?.level) return []
  const data = await loadPublicCategory(scene.category, fetcher)
  const match = matchAuthoredAnalysis(
    {
      text: note.text,
      kind: note.kind,
      sceneId: source.sceneId,
      questionId: source.questionId,
      level: source.level,
    },
    data.analyses,
  )
  if (match.status === 'unknown') return []
  const sourcePack = data.packs.find(
    (pack) => pack.sceneId === source.sceneId && pack.level === source.level,
  )!
  return match.entries.flatMap((analysis) => {
    const descriptor = data.microPractices.find(
      (item) =>
        item.analysisEntryId === analysis.id && item.level === source.level,
    )
    const example = analysis.examples.find(
      (item) => item.level === source.level,
    )
    const text =
      match.status === 'exact'
        ? note.text
        : analysis.forms.find((form) =>
            normalizeAcceptedForm(note.text)
              .split(/[^a-z'-]+/u)
              .includes(normalizeAcceptedForm(form)),
          )
    if (!descriptor || !example || !text) return []
    return [
      {
        analysis,
        sourcePack,
        descriptor,
        target: {
          coverage: match.status as 'exact' | 'partial',
          text,
          kind: analysis.kind,
          meaningZh: analysis.meaningZh,
          example: example.text,
          substitution: example.substitution,
        },
      },
    ]
  })
}
export type SimulationOption = Awaited<
  ReturnType<typeof simulationOptions>
>[number]
export function newSimulation(
  note: NotebookEntry,
  source: NotebookSourceSnapshot,
  option: SimulationOption,
): PracticeSession {
  const start = createDialogue(
    projectMicroPractice(option.sourcePack, option.descriptor),
    { mode: 'short', variantId: option.descriptor.sourceVariantId },
  )
  const at = new Date().toISOString()
  return {
    id: `simulation_${crypto.randomUUID()}`,
    profileId: note.profileId,
    sceneId: option.sourcePack.sceneId,
    sceneVersion: 1,
    level: option.sourcePack.level,
    status: 'active',
    startedAt: at,
    updatedAt: at,
    completedGoals: [],
    openingText: start.reply,
    gradedDialogue: start.snapshot,
    presentation: selectedPracticePresentation(
      start.snapshot.pack,
      start.snapshot.state.variantId,
    ),
    simulation: {
      schemaVersion: 1,
      noteIds: [note.id],
      source: {
        noteId: note.id,
        sourceId: source.id,
        snapshot: structuredClone(source),
        noteText: note.text,
        noteKind: note.kind,
      },
      returnTo: savedNotebookHref(note.id) ?? '/notebook',
      descriptor: option.descriptor,
      target: option.target,
    },
  }
}
