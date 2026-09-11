'use client'
import { useEffect, useState } from 'react'
import type { NotebookEntry } from '@/domain/notebook/types'
import type {
  AnalysisResult,
  LearningAssistantProvider,
} from '@/content/analysis/provider'
import type { Repositories } from '@/infrastructure/persistence/repositories'
import { selectedNotebookSource, selectNotebookSource } from './view-state'

export function useNotebookEntry(
  id: string,
  repository: Repositories,
  assistant: LearningAssistantProvider,
) {
  const [reload, setReload] = useState(0)
  const [loaded, setLoaded] = useState<{
    id: string
    note?: NotebookEntry
    error?: string
  }>()
  const [selection, setSelection] = useState<
    { noteId: string; sourceId: string } | undefined
  >(() => {
    const sourceId = selectedNotebookSource(id)
    return sourceId ? { noteId: id, sourceId } : undefined
  })
  const [analysis, setAnalysis] = useState<{
    key: string
    result?: AnalysisResult
    error?: string
  }>()
  const [sourceExists, setSourceExists] = useState<{
    id: string
    exists: boolean
  }>()
  useEffect(() => {
    let active = true
    void repository.notebook
      .get(id)
      .then((note) => {
        if (active)
          setLoaded({
            id,
            note,
            error: note ? undefined : '找不到这条词句；原数据未被修改。',
          })
      })
      .catch(() => {
        if (active) setLoaded({ id, error: '本机词句暂时无法读取，请重试。' })
      })
    return () => {
      active = false
    }
  }, [id, repository, reload])
  const note = loaded?.id === id ? loaded.note : undefined
  const source =
    note?.sources.find(
      (source) =>
        (selection?.noteId === note.id || selection?.noteId === id) &&
        source.id === selection?.sourceId,
    ) ?? note?.sources[0]
  const key = JSON.stringify([note?.id, note?.text, note?.kind, source])
  useEffect(() => {
    if (!note) return
    let active = true
    void assistant
      .analyze({
        text: note.text,
        kind: note.kind,
        sceneId: source?.sceneId,
        questionId: source?.questionId,
        level: source?.level ?? 'A1',
      })
      .then((result) => {
        if (active) setAnalysis({ key, result })
      })
      .catch(() => {
        if (active)
          setAnalysis({
            key,
            error:
              '本地资料尚未准备好或下载失败；原词句仍可阅读和导出。请重试资料准备。',
          })
      })
    return () => {
      active = false
    }
  }, [assistant, key, note, source, reload])
  useEffect(() => {
    if (!source?.sessionId) return
    let active = true
    void repository.practice
      .read(source.sessionId)
      .then((record) => {
        if (active) setSourceExists({ id: source.sessionId!, exists: !!record })
      })
      .catch(() => {
        if (active) setSourceExists(undefined)
      })
    return () => {
      active = false
    }
  }, [source?.sessionId, repository])
  return {
    note,
    source,
    analysis: analysis?.key === key ? analysis : undefined,
    error: loaded?.id === id ? loaded.error : undefined,
    sourceExists:
      sourceExists && sourceExists.id === source?.sessionId
        ? sourceExists.exists
        : undefined,
    selectSource: (sourceId: string) => {
      if (note) {
        setSelection({ noteId: note.id, sourceId })
        selectNotebookSource(note.id, sourceId)
      }
    },
    reload: () => setReload((n) => n + 1),
  }
}
