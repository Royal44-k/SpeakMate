const key = 'speakmate-notebook-view-v1'
type View = {
  tab?: string
  search?: string
  kind?: string
  sources?: Array<{ noteId: string; sourceId: string }>
}
/** Disposable, bounded per-tab UI state, not learner data or analysis storage. */
export function readNotebookView(): View {
  try {
    const data = JSON.parse(sessionStorage.getItem(key) ?? '{}')
    if (!data || typeof data !== 'object') return {}
    return {
      tab: ['词句', '待复习', '模拟练习'].includes(data.tab)
        ? data.tab
        : undefined,
      search:
        typeof data.search === 'string' ? data.search.slice(0, 200) : undefined,
      kind: ['all', 'word', 'phrase', 'sentence'].includes(data.kind)
        ? data.kind
        : undefined,
      sources: Array.isArray(data.sources)
        ? data.sources
            .filter(
              (s: unknown) =>
                !!s &&
                typeof s === 'object' &&
                'noteId' in s &&
                typeof s.noteId === 'string' &&
                s.noteId.length <= 2000 &&
                'sourceId' in s &&
                typeof s.sourceId === 'string' &&
                s.sourceId.length <= 2000,
            )
            .slice(-32)
        : [],
    }
  } catch {
    return {}
  }
}
export function saveNotebookView(next: View) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ ...readNotebookView(), ...next }),
    )
  } catch {
    /* Optional UI restoration must never block local records. */
  }
}
export function selectedNotebookSource(noteId: string) {
  return readNotebookView().sources?.find((item) => item.noteId === noteId)
    ?.sourceId
}
export function selectNotebookSource(noteId: string, sourceId: string) {
  saveNotebookView({
    sources: [
      ...(readNotebookView().sources ?? []).filter(
        (item) => item.noteId !== noteId,
      ),
      { noteId, sourceId },
    ].slice(-32),
  })
}
