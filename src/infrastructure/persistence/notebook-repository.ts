import type { NotebookEntry } from '@/domain/notebook/types'
import type { FavoriteExpression } from '@/domain/learning/types'
import { canonical, createGuestProfile } from './identity'
import {
  mergeNote,
  normalizeNotebookText,
  noteFromFavorite,
  notebookIdentityMap,
} from './notebook-data'
import { put, type DataState, type LocalStoragePort } from './storage'
import { favoriteSchema, isoSchema, notebookSchema } from './backup-schemas'
import { validateNotebookRelations } from './data-invariants'

function validateNotebookWrite(state: DataState): void {
  for (const note of state.notebook) notebookSchema.parse(note)
  for (const favorite of state.favorites) favoriteSchema.parse(favorite)
  validateNotebookRelations(state)
}

export interface NotebookRepository {
  capture(
    entry: NotebookEntry,
  ): Promise<{ entry: NotebookEntry; duplicate: boolean; receipt: string }>
  undoCapture(receipt: string, at: string): Promise<void>
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
    validateNotebookWrite(state)
    return // Repeated compatibility save must not overwrite edited text/snapshots.
  }
  put(state.notebook, existing ? mergeNote(existing, candidate) : candidate)
  put(state.favorites, favorite)
  validateNotebookWrite(state)
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
  // Ephemeral, instance-bound capabilities: no new history store or backup payload.
  const receipts = new Map<
    string,
    { before?: NotebookEntry; after: NotebookEntry }
  >()
  return {
    capture: async (input) => {
      const mutation = await storage.change((state) => {
        const entry = notebookSchema.parse({
          ...input,
          normalizedText: normalizeNotebookText(input.text),
        })
        if (state.profile[0]?.id !== entry.profileId)
          throw new Error('BROKEN_PROFILE_REFERENCE')
        const before = state.notebook.find(
          (note) =>
            note.profileId === entry.profileId &&
            note.normalizedText === entry.normalizedText,
        )
        if (before?.deletedAt) throw new Error('NOTE_DELETED_USE_UNDO')
        if (!before && notebookIdentityMap(state.notebook).has(entry.id))
          throw new Error('NOTE_EDIT_COLLISION')
        // Capture adds provenance, never replaces an existing personal edit or creates a spurious alias.
        const after = before
          ? {
              ...mergeNote(before, { ...before, sources: entry.sources }),
              updatedAt: entry.updatedAt,
            }
          : entry
        put(state.notebook, after)
        syncFavorites(state, after)
        validateNotebookWrite(state)
        return { before, after }
      })
      const receipt = crypto.randomUUID()
      receipts.set(receipt, structuredClone(mutation))
      if (receipts.size > 32) receipts.delete(receipts.keys().next().value!)
      return { entry: mutation.after, duplicate: !!mutation.before, receipt }
    },
    undoCapture: async (receipt, at) => {
      const mutation = receipts.get(receipt)
      if (!mutation) throw new Error('CAPTURE_RECEIPT_INVALID')
      await storage.change((state) => {
        isoSchema.parse(at)
        const current = notebookIdentityMap(state.notebook).get(
          mutation.after.id,
        )
        if (canonical(current) !== canonical(mutation.after))
          throw new Error('CAPTURE_UNDO_CONFLICT')
        const reverted = mutation.before ?? {
          ...mutation.after,
          deletedAt: at,
          updatedAt: at,
        }
        put(state.notebook, reverted)
        syncFavorites(state, reverted)
        validateNotebookWrite(state)
      })
      receipts.delete(receipt)
    },
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
        syncFavorites(state, merged)
        validateNotebookWrite(state)
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
        validateNotebookWrite(state)
      }),
    restore: (id, at) =>
      storage.change((state) => {
        isoSchema.parse(at)
        const note = notebookIdentityMap(state.notebook).get(id)
        if (!note) throw new Error('NOTE_NOT_FOUND')
        delete note.deletedAt
        note.updatedAt = at
        syncFavorites(state, note)
        validateNotebookWrite(state)
        return note
      }),
  }
}
