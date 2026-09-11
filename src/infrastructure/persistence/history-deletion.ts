import type { PracticeRecord } from './practice-repository'
import type { LocalStoragePort } from './storage'
import { canonical, validateRelations } from './data-invariants'

/** Page-instance undo only; no tombstone store or route ID rewriting. */
export function createHistoryDeletion(storage: LocalStoragePort) {
  const receipts = new Map<
    string,
    { record: Pick<PracticeRecord, 'session' | 'turns'>; identity: string }
  >()
  return {
    async deleteHistory(
      expected: Pick<PracticeRecord, 'session' | 'turns'>,
    ): Promise<string> {
      const snapshot = structuredClone(expected)
      const receipt = crypto.randomUUID()
      const removed = await storage.change((state) => {
        const session = state.sessions.find(
          (row) => row.id === snapshot.session.id,
        )
        const turns = state.turns
          .filter((row) => row.sessionId === snapshot.session.id)
          .sort((a, b) => a.index - b.index)
        if (
          !session ||
          canonical(session) !== canonical(snapshot.session) ||
          canonical(turns) !== canonical(snapshot.turns) ||
          state.profile[0]?.id !== session.profileId
        )
          throw new Error('HISTORY_STALE')
        const identity = canonical([
          state.profile[0].id,
          state.profile[0].createdAt,
        ])
        state.sessions = state.sessions.filter((row) => row.id !== session.id)
        state.turns = state.turns.filter((row) => row.sessionId !== session.id)
        validateRelations(state)
        return { record: { session, turns }, identity }
      })
      receipts.set(receipt, structuredClone(removed))
      if (receipts.size > 32) receipts.delete(receipts.keys().next().value!)
      return receipt
    },
    async undoDeleteHistory(receipt: string): Promise<void> {
      const saved = receipts.get(receipt)
      if (!saved) throw new Error('HISTORY_RECEIPT_INVALID')
      await storage.change((state) => {
        const { session, turns } = saved.record
        if (
          canonical([state.profile[0]?.id, state.profile[0]?.createdAt]) !==
            saved.identity ||
          state.sessions.some((row) => row.id === session.id) ||
          state.turns.some(
            (row) =>
              row.sessionId === session.id ||
              turns.some((old) => old.id === row.id),
          )
        )
          throw new Error('HISTORY_UNDO_CONFLICT')
        state.sessions.push(structuredClone(session))
        state.turns.push(...structuredClone(turns))
        validateRelations(state)
      })
      receipts.delete(receipt)
    },
  }
}
