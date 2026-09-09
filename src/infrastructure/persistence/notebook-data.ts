import type { FavoriteExpression } from '@/domain/learning/types'
import type { NotebookEntry } from '@/domain/notebook/types'
import type { PracticeSession, PracticeTurn } from '@/domain/practice/types'
import { stableId, canonical } from './identity'

export function normalizeNotebookText(text: string): string {
  return text
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, '')
    .replace(/\s+/gu, ' ')
}

export function noteFromFavorite(
  favorite: FavoriteExpression,
  profileId: string,
  turn?: PracticeTurn,
  session?: PracticeSession,
): NotebookEntry {
  return {
    id: stableId('favorite-note', favorite.id),
    profileId,
    kind: 'sentence',
    text: favorite.expression,
    normalizedText: normalizeNotebookText(favorite.expression),
    translationZh: favorite.translationZh,
    notes: '',
    tags: [],
    favoriteIds: [favorite.id],
    sources: [
      {
        id: favorite.id,
        kind: 'favorite',
        originalText: favorite.expression,
        translationZh: favorite.translationZh,
        sceneId: favorite.sceneId,
        turnId: favorite.turnId,
        sessionId: session?.id,
        level: session?.level,
        sceneTitleZh: session?.sceneSnapshot?.titleZh,
        learnerText: turn?.learnerText,
        correctedText: turn?.feedback?.corrected,
        naturalText: turn?.feedback?.natural,
        explanationZh: turn?.feedback?.explanationZh,
        createdAt: favorite.createdAt,
      },
    ],
    createdAt: favorite.createdAt,
    updatedAt: favorite.updatedAt,
  }
}

export function mergeNote(
  existing: NotebookEntry,
  incoming: NotebookEntry,
): NotebookEntry {
  const sources = new Map(existing.sources.map((source) => [source.id, source]))
  for (const source of incoming.sources) {
    const old = sources.get(source.id)
    if (old && canonical(old) !== canonical(source))
      throw new Error('NOTE_SOURCE_CONFLICT')
    sources.set(source.id, source)
  }
  const newest =
    Date.parse(incoming.updatedAt) > Date.parse(existing.updatedAt)
      ? incoming
      : existing
  const aliases = [
    ...new Set([
      ...(existing.aliasIds ?? []),
      ...(incoming.aliasIds ?? []),
      incoming.id,
    ]),
  ].filter((id) => id !== existing.id)
  return {
    ...newest,
    id: existing.id,
    ...(aliases.length ? { aliasIds: aliases } : {}),
    createdAt:
      Date.parse(existing.createdAt) < Date.parse(incoming.createdAt)
        ? existing.createdAt
        : incoming.createdAt,
    sources: [...sources.values()],
    favoriteIds: [
      ...new Set([...existing.favoriteIds, ...incoming.favoriteIds]),
    ],
  }
}

/** A retained historical note ID must resolve to exactly one canonical record. */
export function notebookIdentityMap(
  notes: NotebookEntry[],
): Map<string, NotebookEntry> {
  const result = new Map<string, NotebookEntry>()
  for (const note of notes) {
    for (const id of [note.id, ...(note.aliasIds ?? [])]) {
      if (result.has(id)) throw new Error('NOTE_ALIAS_CONFLICT')
      result.set(id, note)
    }
  }
  return result
}
