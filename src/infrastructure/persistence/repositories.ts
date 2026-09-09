import type {
  FavoriteExpression,
  LearnerProfile,
  LearnerSettings,
} from '@/domain/learning/types'
import type { PracticeSession, PracticeTurn } from '@/domain/practice/types'
import type { NotebookEntry, ReviewRecord } from '@/domain/notebook/types'
import type {
  DailyPlan,
  LearningEvent,
  PointsLedgerEntry,
  RewardUnlock,
} from '@/domain/goals/types'
import type { OutboxItem } from './db'
import { createGuestProfile } from './identity'
import {
  bridgeFavorite,
  createNotebookRepository,
  type NotebookRepository,
} from './notebook-repository'
import {
  createMemoryStorage,
  createIndexedDbStorage,
  emptyState,
  put,
  type LocalStoragePort,
} from './storage'
import {
  createLearningRepository,
  type LearningRepository,
} from './learning-repository'
import {
  createBackupPort,
  type RestorePreview,
  type RestoreResult,
} from './backup'
import {
  profileSchema,
  sessionSchema,
  turnSchema,
  favoriteSchema,
} from './backup-schemas'

export interface ProfileRepository {
  get(): Promise<LearnerProfile | undefined>
  ensureGuestProfile(): Promise<LearnerProfile>
  save(profile: LearnerProfile): Promise<void>
}
export interface SessionRepository {
  get(id: string): Promise<PracticeSession | undefined>
  list(): Promise<PracticeSession[]>
  save(session: PracticeSession): Promise<void>
  findRecoverable(): Promise<PracticeSession | null>
}
export interface TurnRepository {
  list(): Promise<PracticeTurn[]>
  listBySession(sessionId: string): Promise<PracticeTurn[]>
  save(turn: PracticeTurn): Promise<void>
}
export interface FavoriteRepository {
  list(): Promise<FavoriteExpression[]>
  save(favorite: FavoriteExpression): Promise<void>
  remove(id: string): Promise<void>
}
export interface LearnerDataExportV1 {
  schemaVersion: 1
  exportedAt: string
  profile?: LearnerProfile
  sessions: PracticeSession[]
  turns: PracticeTurn[]
  favorites: FavoriteExpression[]
  settings?: LearnerSettings
}
export interface LearnerDataExportV2 extends Omit<
  LearnerDataExportV1,
  'schemaVersion'
> {
  schemaVersion: 2
  notebook: NotebookEntry[]
  reviews: ReviewRecord[]
  dailyPlans: DailyPlan[]
  learningEvents: LearningEvent[]
  pointsLedger: PointsLedgerEntry[]
  rewardUnlocks: RewardUnlock[]
  outbox: OutboxItem[]
}
export type LearnerDataExport = LearnerDataExportV1 | LearnerDataExportV2
export interface Repositories {
  profiles: ProfileRepository
  sessions: SessionRepository
  turns: TurnRepository
  favorites: FavoriteRepository
  notebook: NotebookRepository
  learning: LearningRepository
  previewRestore(input: string | File): Promise<RestorePreview>
  restoreLearnerData(preview: RestorePreview): Promise<RestoreResult>
  saveTurnAndSession(
    turn: PracticeTurn,
    session: PracticeSession,
  ): Promise<void>
  exportLearnerData(): Promise<LearnerDataExportV2>
  clearLearnerData(): Promise<void>
}

function createRepositories(storage: LocalStoragePort): Repositories {
  const notebook = createNotebookRepository(storage)
  return {
    profiles: {
      get: () => storage.read((state) => state.profile[0]),
      ensureGuestProfile: () =>
        storage.change((state) => (state.profile[0] ??= createGuestProfile())),
      save: (profile) =>
        storage.change((state) => {
          state.profile = [profileSchema.parse(profile)]
        }),
    },
    sessions: {
      get: (id) =>
        storage.read((state) =>
          state.sessions.find((session) => session.id === id),
        ),
      list: () => storage.read((state) => state.sessions),
      save: (session) =>
        storage.change((state) =>
          put(state.sessions, sessionSchema.parse(session) as PracticeSession),
        ),
      findRecoverable: () =>
        storage.read(
          (state) =>
            state.sessions
              .filter((session) => session.status === 'active')
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
            null,
        ),
    },
    turns: {
      list: () => storage.read((state) => state.turns),
      listBySession: (id) =>
        storage.read((state) =>
          state.turns
            .filter((turn) => turn.sessionId === id)
            .sort((a, b) => a.index - b.index),
        ),
      save: (turn) =>
        storage.change((state) => put(state.turns, turnSchema.parse(turn))),
    },
    favorites: {
      list: () => storage.read((state) => state.favorites),
      save: (favorite) =>
        storage.change((state) =>
          bridgeFavorite(state, favoriteSchema.parse(favorite)),
        ),
      remove: (id) =>
        storage.change((state) => {
          state.favorites = state.favorites.filter(
            (favorite) => favorite.id !== id,
          )
          const note = state.notebook.find((item) =>
            item.favoriteIds.includes(id),
          )
          if (note) {
            const now = new Date().toISOString()
            note.deletedAt = now
            note.updatedAt = now
            state.favorites = state.favorites.filter(
              (favorite) => !note.favoriteIds.includes(favorite.id),
            )
          }
        }),
    },
    notebook,
    learning: createLearningRepository(storage),
    ...createBackupPort(storage),
    saveTurnAndSession: (turn, session) =>
      storage.change((state) => {
        if (turn.sessionId !== session.id)
          throw new Error('TURN_SESSION_MISMATCH')
        put(state.turns, turnSchema.parse(turn))
        put(state.sessions, sessionSchema.parse(session) as PracticeSession)
      }),
    clearLearnerData: () =>
      storage.change((state) => {
        Object.assign(state, emptyState())
      }),
  }
}
export function createMemoryRepositories(): Repositories {
  return createRepositories(createMemoryStorage())
}
export function createIndexedDbRepositories(): Repositories {
  return createRepositories(createIndexedDbStorage())
}
