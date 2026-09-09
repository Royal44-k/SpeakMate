import type { NotebookEntry } from '@/domain/notebook/types'
import type { FavoriteExpression } from '@/domain/learning/types'
import { createGuestProfile } from './identity'
import {
  mergeNote,
  normalizeNotebookText,
  noteFromFavorite,
  notebookIdentityMap,
} from './notebook-data'
import { put, type DataState, type LocalStoragePort } from './storage'
import { isoSchema, notebookSchema } from './backup-schemas'

export interface NotebookRepository {
  get(id: string): Promise<NotebookEntry | undefined>
  list(query?: {
    profileId?: string
    includeDeleted?: boolean
  }): Promise<NotebookEntry[]>
  save(entry: NotebookEntry): Promise<NotebookEntry>
  remove(id: string, at: string): Promise<void>
  restore(id: string, at: string): Promise<NotebookEntry>
}

export function bridgeFavorite(
  state: DataState,
  favorite: FavoriteExpression,
): void {
  state.profile[0] ??= createGuestProfile()
  const turn = state.turns.find((item) => item.id === favorite.turnId)
  const session = state.sessions.find((item) => item.id === turn?.sessionId)
  const candidate = noteFromFavorite(
    favorite,
    state.profile[0].id,
    turn,
    session,
  )
  const existing = state.notebook.find(
    (note) =>
      note.favoriteIds.includes(favorite.id) ||
      (note.profileId === candidate.profileId &&
        note.normalizedText === candidate.normalizedText),
  )
  if (existing?.deletedAt) return // Only explicit notebook.restore can revive a deleted bridge.
  if (existing?.favoriteIds.includes(favorite.id)) {
    syncFavorites(state, existing)
    return // Repeated compatibility save must not overwrite edited text/snapshots.
  }
  put(state.notebook, existing ? mergeNote(existing, candidate) : candidate)
  put(state.favorites, favorite)
}

function syncFavorites(state: DataState, note: NotebookEntry): void {
  state.favorites = state.favorites.filter(
    (favorite) => !note.favoriteIds.includes(favorite.id),
  )
  if (note.deletedAt) return
  for (const id of note.favoriteIds) {
    const source = note.sources.find(
      (item) => item.id === id && item.kind === 'favorite',
    )
    state.favorites.push({
      id,
      expression: note.text,
      translationZh: note.translationZh,
      sceneId: source?.sceneId,
      turnId: source?.turnId,
      createdAt: source?.createdAt ?? note.createdAt,
      updatedAt: note.updatedAt,
    })
  }
}

export function createNotebookRepository(
  storage: LocalStoragePort,
): NotebookRepository {
  return {
    get: (id) =>
      storage.read((state) => notebookIdentityMap(state.notebook).get(id)),
    list: (query = {}) =>
      storage.read((state) =>
        state.notebook.filter(
          (note) =>
            (query.includeDeleted || !note.deletedAt) &&
            (!query.profileId || note.profileId === query.profileId),
        ),
      ),
    save: (input) =>
      storage.change((state) => {
        const entry = structuredClone(input)
        entry.normalizedText = normalizeNotebookText(entry.text)
        notebookSchema.parse(entry)
        if (state.profile[0]?.id !== entry.profileId)
          throw new Error('BROKEN_PROFILE_REFERENCE')
        if (!entry.normalizedText || entry.text.length > 20_000)
          throw new Error('INVALID_NOTE_TEXT')
        const sameId = notebookIdentityMap(state.notebook).get(entry.id)
        if (sameId) entry.id = sameId.id
        const duplicate = state.notebook.find(
          (note) =>
            note.id !== entry.id &&
            note.profileId === entry.profileId &&
            note.normalizedText === entry.normalizedText,
        )
        if (sameId && duplicate) throw new Error('NOTE_EDIT_COLLISION')
        if (sameId?.deletedAt || duplicate?.deletedAt)
          throw new Error('NOTE_DELETED_USE_UNDO')
        const merged = duplicate
          ? mergeNote(duplicate, entry)
          : sameId
            ? mergeNote(sameId, entry)
            : entry
        put(state.notebook, merged)
        notebookIdentityMap(state.notebook)
        syncFavorites(state, merged)
        return merged
      }),
    remove: (id, at) =>
      storage.change((state) => {
        isoSchema.parse(at)
        const note = notebookIdentityMap(state.notebook).get(id)
        if (!note) return
        note.deletedAt = at
        note.updatedAt = at
        syncFavorites(state, note)
      }),
    restore: (id, at) =>
      storage.change((state) => {
        isoSchema.parse(at)
        const note = notebookIdentityMap(state.notebook).get(id)
        if (!note) throw new Error('NOTE_NOT_FOUND')
        delete note.deletedAt
        note.updatedAt = at
        syncFavorites(state, note)
        return note
      }),
  }
}
