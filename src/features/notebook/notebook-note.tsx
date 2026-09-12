'use client'
import { useEffect, useRef, useState } from 'react'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'
import type { LearningAssistantProvider } from '@/content/analysis/provider'
import { publicLearningAssistant } from '@/content/public-category'
import {
  savedNotebookHref,
  savedPracticeHref,
  safeSourceHref,
} from '@/components/app-shell/learning-routes'
import { ExitGuard } from '@/features/practice/exit-guard'
import { useNotebookEntry } from './use-notebook-entry'
import styles from './notebook.module.css'
import { SimulationEntry } from './simulation-entry'
import { ReviewCard } from './review-card'
import { browserTts } from '@/infrastructure/audio/browser-tts'
const publicAssistant = publicLearningAssistant()
function NotebookNoteContent({
  id,
  repositories,
  assistant = publicAssistant,
  returnHref,
}: {
  id: string
  repositories?: Repositories
  assistant?: LearningAssistantProvider
  returnHref?: string
}) {
  const [repo] = useState(() => repositories ?? createIndexedDbRepositories())
  const [mode, setMode] = useState<'note' | 'review' | 'simulation'>('note')
  const entry = useNotebookEntry(id, repo, assistant)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const speechRequest = useRef(0)
  const note = entry.note
  const backHref = safeSourceHref(returnHref) ?? '/notebook'
  useEffect(() => {
    if (!editing && !busy) return
    const root = document.documentElement
    const previous = root.dataset.interactionBusy
    root.dataset.interactionBusy = 'true'
    return () => {
      if (previous === undefined) delete root.dataset.interactionBusy
      else root.dataset.interactionBusy = previous
    }
  }, [editing, busy])
  useEffect(
    () => () => {
      speechRequest.current += 1
      browserTts.stop()
    },
    [mode, editing, note?.text],
  )
  function stopReading() {
    speechRequest.current += 1
    browserTts.stop()
  }
  async function readAloud() {
    if (!note) return
    stopReading()
    const request = speechRequest.current
    setError('')
    let settings
    try {
      settings = await repo.learning.getSettings()
    } catch {
      if (request === speechRequest.current)
        setError('本机语音设置暂时无法读取，未开始朗读。请重试；原文仍可阅读。')
      return
    }
    if (request !== speechRequest.current) return
    try {
      await browserTts.speak(note.text, { rate: settings.speechRate })
    } catch {
      if (request === speechRequest.current)
        setError('本机英语音色不可用，请直接看原文跟读；不会改用云端声音。')
    }
  }
  async function save() {
    if (!note || busy) return
    setBusy(true)
    setError('')
    try {
      await repo.notebook.save({
        ...note,
        text,
        notes,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        updatedAt: new Date().toISOString(),
      })
      setEditing(false)
      entry.reload()
    } catch {
      setError('修改未保存，请重试；输入仍保留。')
    } finally {
      setBusy(false)
    }
  }
  if (entry.error)
    return (
      <main className={styles.page}>
        <h1 data-page-title tabIndex={-1}>
          词句暂不可用
        </h1>
        <p role="alert">{entry.error}</p>
        <button onClick={entry.reload}>重试读取</button>
        <a href="/notebook">返回记录簿</a>
        <a href="/privacy">导出本机数据</a>
      </main>
    )
  if (!note)
    return (
      <main className={styles.page}>
        <p role="status">正在读取词句…</p>
        <a href="/notebook">返回记录簿</a>
      </main>
    )
  if (mode === 'simulation')
    return (
      <SimulationEntry
        key={`${note.id}:${entry.source?.id}`}
        noteId={note.id}
        sourceId={entry.source?.id}
        repositories={repo}
      />
    )
  if (mode === 'review')
    return (
      <main className={styles.page}>
        <h1 data-page-title tabIndex={-1}>
          词句复习
        </h1>
        <ReviewCard
          key={note.id}
          note={note}
          repositories={repo}
          assistant={assistant}
        />
        <button onClick={() => setMode('note')}>返回此词句</button>
      </main>
    )
  const sourceHref =
    entry.source?.sessionId &&
    savedPracticeHref(entry.source.sessionId, 'session')
  return (
    <main
      className={styles.page}
      data-interaction-busy={editing || busy ? 'true' : undefined}
    >
      <ExitGuard
        state={editing ? 'draft' : busy ? 'processing' : 'clean'}
        fallbackHref={backHref}
        onConfirmExit={() => setEditing(false)}
      />
      <small>
        原文 ·{' '}
        {note.kind === 'word'
          ? '单词'
          : note.kind === 'phrase'
            ? '短语'
            : '整句'}
      </small>
      <h1 data-page-title tabIndex={-1} className={styles.original}>
        {note.text}
      </h1>
      {!savedNotebookHref(note.id) ? (
        <p>
          此保留编号不能直接链接；可在此阅读完整词句及导出，原编号保持不变。
        </p>
      ) : null}
      {note.deletedAt ? (
        <section className={styles.card}>
          <p>这条词句已删除，原文仍保留。</p>
          <button
            disabled={busy}
            onClick={() => {
              setBusy(true)
              void repo.notebook
                .restore(note.id, new Date().toISOString())
                .then(entry.reload)
                .catch(() => setError('撤销删除失败，请重试。'))
                .finally(() => setBusy(false))
            }}
          >
            撤销删除
          </button>
        </section>
      ) : null}
      <section className={styles.card}>
        <h2>来源与语境</h2>
        {note.sources.length ? (
          <>
            <label>
              解析所用来源
              <select
                value={entry.source?.id ?? ''}
                onChange={(event) => entry.selectSource(event.target.value)}
              >
                {note.sources.map((source, index) => (
                  <option key={source.id} value={source.id}>
                    {index + 1} ·{' '}
                    {source.sceneTitleZh ?? source.sceneId ?? '手动或旧记录'} ·{' '}
                    {source.level ?? '等级未保存'}
                  </option>
                ))}
              </select>
            </label>
            <p>{entry.source?.originalText}</p>
            <p>
              {entry.source?.questionId ??
                '未保存题目语境，不借用其他来源补全解析。'}
            </p>
            {entry.source?.sessionId ? (
              entry.sourceExists === false ? (
                <p>原练习已删除</p>
              ) : entry.sourceExists && sourceHref ? (
                <a data-return-to-source href={sourceHref}>
                  返回来源练习
                </a>
              ) : (
                <p>来源无法直接打开；保存时的原文仍保留。</p>
              )
            ) : null}
          </>
        ) : (
          <p>手动或旧词句没有已保存语境，仅提供本地有限覆盖与自我回忆。</p>
        )}
      </section>
      <section className={styles.card}>
        <h2>校审资料 · 本地学习助手</h2>
        <p>不是通用 AI，不评判未收录文字的语义、语法或发音。</p>
        {entry.analysis?.error ? (
          <>
            <p role="alert">{entry.analysis.error}</p>
            <button onClick={entry.reload}>重试资料准备</button>
            <a href="/practice">完成更新后返回重试</a>
          </>
        ) : entry.analysis?.result ? (
          <>
            <p>{entry.analysis.result.explanationZh}</p>
            <strong>
              {entry.analysis.result.status === 'exact'
                ? '本语境完整匹配'
                : entry.analysis.result.status === 'partial'
                  ? '仅部分片段有覆盖'
                  : '当前本地资料未收录'}
            </strong>
            {entry.analysis.result.entries.map((item) => (
              <article key={item.id}>
                <p>{item.meaningZh}</p>
                <small>
                  资料版本 {item.contentVersion} · 模型辅助校审，非教师认证
                </small>
                <details>
                  <summary>结构、用法与常见错点</summary>
                  <p>{item.grammarZh}</p>
                  <p>{item.registerZh}</p>
                  <p>{item.errorsZh}</p>
                </details>
                <details>
                  <summary>同来源等级例句</summary>
                  {item.examples
                    .filter((example) => example.level === entry.source?.level)
                    .map((example) => (
                      <div key={example.text}>
                        <p lang="en">{example.text}</p>
                        <p lang="en">{example.substitution}</p>
                      </div>
                    ))}
                </details>
              </article>
            ))}
          </>
        ) : (
          <p role="status">正在本机匹配公开资料…</p>
        )}
      </section>
      {!note.deletedAt ? (
        <section className={styles.card}>
          <h2>把词句练起来</h2>
          <p>自评只代表自己的回忆情况；未收录内容不生成模拟或评分。</p>
          <div className={styles.actions}>
            <button
              disabled={editing || busy}
              onClick={() => setMode('review')}
            >
              开始自我回忆
            </button>
            <button disabled={editing || busy} onClick={() => void readAloud()}>
              本地跟读原文
            </button>
            <button onClick={stopReading}>停止朗读</button>
            {entry.analysis?.result?.status !== 'unknown' &&
            entry.analysis?.result?.entries.length ? (
              <button
                disabled={editing || busy}
                onClick={() => setMode('simulation')}
              >
                用所选来源模拟练习
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
      <section className={styles.card}>
        <h2>个人备注</h2>
        <p>{note.notes || '还没有备注。'}</p>
        <p>{note.tags.join(' · ')}</p>
        {editing ? (
          <>
            <label>
              原文
              <textarea
                value={text}
                disabled={busy}
                maxLength={20000}
                onChange={(event) => setText(event.target.value)}
              />
            </label>
            <label>
              个人备注
              <textarea
                value={notes}
                disabled={busy}
                maxLength={20000}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
            <label>
              标签（逗号分隔）
              <input
                value={tags}
                disabled={busy}
                maxLength={2000}
                onChange={(event) => setTags(event.target.value)}
              />
            </label>
            <div className={styles.actions}>
              <button disabled={busy} onClick={() => setEditing(false)}>
                取消修改
              </button>
              <button
                disabled={busy || !text.trim()}
                onClick={() => void save()}
              >
                保存修改
              </button>
            </div>
          </>
        ) : (
          <button
            disabled={!!note.deletedAt}
            onClick={() => {
              setText(note.text)
              setNotes(note.notes)
              setTags(note.tags.join(', '))
              setEditing(true)
            }}
          >
            编辑词句
          </button>
        )}
      </section>
      {!note.deletedAt ? (
        <button
          disabled={busy || editing}
          onClick={() => {
            setBusy(true)
            void repo.notebook
              .remove(note.id, new Date().toISOString())
              .then(entry.reload)
              .catch(() => setError('删除未保存，请重试。'))
              .finally(() => setBusy(false))
          }}
        >
          删除词句
        </button>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
      <div className={styles.actions}>
        {backHref !== '/notebook' ? (
          <a data-return-to-source href={backHref}>
            返回来源页面
          </a>
        ) : null}
        <a data-return-to-source href="/notebook">
          返回记录簿
        </a>
        <a href="/privacy">导出本机数据</a>
      </div>
    </main>
  )
}

export function NotebookNote(props: Parameters<typeof NotebookNoteContent>[0]) {
  return <NotebookNoteContent key={props.id} {...props} />
}
