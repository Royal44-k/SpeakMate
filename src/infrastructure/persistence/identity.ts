import type { LearnerProfile } from '@/domain/learning/types'

export function createGuestProfile(
  id = `guest_${crypto.randomUUID()}`,
  timestamp = new Date().toISOString(),
): LearnerProfile {
  return {
    id,
    level: 'A2',
    goals: ['travel'],
    dailyMinutes: 5,
    onboardingCompleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

/** Unambiguous, JSON-safe identity, independent of the current date or random retries. */
export function stableId(...parts: string[]): string {
  return parts.map((part) => `${part.length}:${part}`).join('|')
}

export function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
        )
      : item,
  )
}
