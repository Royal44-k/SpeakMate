import type {
  FavoriteExpression,
  LearnerProfile,
  LearnerSettings,
} from '@/domain/learning/types'
import type { PracticeSession, PracticeTurn } from '@/domain/practice/types'

import { deleteDatabase, getDatabase } from './db'

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

export interface LearnerDataExport {
  schemaVersion: 1
  exportedAt: string
  profile?: LearnerProfile
  sessions: PracticeSession[]
  turns: PracticeTurn[]
  favorites: FavoriteExpression[]
  settings?: LearnerSettings
}

export interface Repositories {
  profiles: ProfileRepository
  sessions: SessionRepository
  turns: TurnRepository
  favorites: FavoriteRepository
  exportLearnerData(): Promise<LearnerDataExport>
  clearLearnerData(): Promise<void>
}

function createGuestProfile(): LearnerProfile {
  const timestamp = new Date().toISOString()
  return {
    id: `guest_${createId()}`,
    level: 'A2',
    goals: ['travel'],
    dailyMinutes: 5,
    onboardingCompleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

function byUpdatedAtDescending<T extends { updatedAt: string }>(a: T, b: T): number {
  return b.updatedAt.localeCompare(a.updatedAt)
}

export function createMemoryRepositories(): Repositories {
  let profile: LearnerProfile | undefined
  let settings: LearnerSettings | undefined
  const sessions = new Map<string, PracticeSession>()
  const turns = new Map<string, PracticeTurn>()
  const favorites = new Map<string, FavoriteExpression>()

  const repositories: Repositories = {
    profiles: {
      async get() {
        return profile ? structuredClone(profile) : undefined
      },
      async ensureGuestProfile() {
        profile ??= createGuestProfile()
        return structuredClone(profile)
      },
      async save(value) {
        profile = structuredClone(value)
      },
    },
    sessions: {
      async get(id) {
        const value = sessions.get(id)
        return value ? structuredClone(value) : undefined
      },
      async list() {
        return [...sessions.values()].map((value) => structuredClone(value))
      },
      async save(value) {
        sessions.set(value.id, structuredClone(value))
      },
      async findRecoverable() {
        const value = [...sessions.values()]
          .filter((session) => session.status === 'active')
          .sort(byUpdatedAtDescending)[0]
        return value ? structuredClone(value) : null
      },
    },
    turns: {
      async list() {
        return [...turns.values()].map((value) => structuredClone(value))
      },
      async listBySession(sessionId) {
        return [...turns.values()]
          .filter((turn) => turn.sessionId === sessionId)
          .sort((a, b) => a.index - b.index)
          .map((value) => structuredClone(value))
      },
      async save(value) {
        turns.set(value.id, structuredClone(value))
      },
    },
    favorites: {
      async list() {
        return [...favorites.values()].map((value) => structuredClone(value))
      },
      async save(value) {
        favorites.set(value.id, structuredClone(value))
      },
      async remove(id) {
        favorites.delete(id)
      },
    },
    async exportLearnerData() {
      return {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        profile: profile ? structuredClone(profile) : undefined,
        sessions: await repositories.sessions.list(),
        turns: await repositories.turns.list(),
        favorites: await repositories.favorites.list(),
        settings: settings ? structuredClone(settings) : undefined,
      }
    },
    async clearLearnerData() {
      profile = undefined
      settings = undefined
      sessions.clear()
      turns.clear()
      favorites.clear()
    },
  }

  return repositories
}

export function createIndexedDbRepositories(): Repositories {
  const repositories: Repositories = {
    profiles: {
      async get() {
        return (await getDatabase()).getAll('profile').then((items) => items[0])
      },
      async ensureGuestProfile() {
        const existing = await this.get()
        if (existing) return existing
        const profile = createGuestProfile()
        await this.save(profile)
        return profile
      },
      async save(profile) {
        await (await getDatabase()).put('profile', profile)
      },
    },
    sessions: {
      async get(id) {
        return (await getDatabase()).get('sessions', id)
      },
      async list() {
        return (await getDatabase()).getAll('sessions')
      },
      async save(session) {
        await (await getDatabase()).put('sessions', session)
      },
      async findRecoverable() {
        const sessions = await this.list()
        return sessions
          .filter((session) => session.status === 'active')
          .sort(byUpdatedAtDescending)[0] ?? null
      },
    },
    turns: {
      async list() {
        return (await getDatabase()).getAll('turns')
      },
      async listBySession(sessionId) {
        const turns = await (await getDatabase()).getAllFromIndex(
          'turns',
          'by-session',
          sessionId,
        )
        return turns.sort((a, b) => a.index - b.index)
      },
      async save(turn) {
        await (await getDatabase()).put('turns', turn)
      },
    },
    favorites: {
      async list() {
        return (await getDatabase()).getAll('favorites')
      },
      async save(favorite) {
        await (await getDatabase()).put('favorites', favorite)
      },
      async remove(id) {
        await (await getDatabase()).delete('favorites', id)
      },
    },
    async exportLearnerData() {
      const database = await getDatabase()
      const [profile, sessions, turns, favorites, settings] = await Promise.all([
        database.getAll('profile'),
        database.getAll('sessions'),
        database.getAll('turns'),
        database.getAll('favorites'),
        database.getAll('settings'),
      ])
      return {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        profile: profile[0],
        sessions,
        turns,
        favorites,
        settings: settings[0],
      }
    },
    async clearLearnerData() {
      await deleteDatabase()
    },
  }

  return repositories
}
