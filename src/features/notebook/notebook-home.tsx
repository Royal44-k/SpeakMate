/* eslint-disable @next/next/no-html-link-for-pages -- Fixed offline shells require document navigation, never RSC prefetch. */
'use client'
import { useEffect, useState } from 'react'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'
import type { LearningAssistantProvider } from '@/content/analysis/provider'
import type { NotebookEntry } from '@/domain/notebook/types'
import {
  savedNotebookHref,
  savedSimulationHref,
} from '@/components/app-shell/learning-routes'
import type { PracticeSession } from '@/domain/practice/types'
import { ReviewCard } from './review-card'
import { readNotebookView, saveNotebookView } from './view-state'
import { HistoricalPracticeRecord } from '@/features/practice/historical-practice-record'
import type { PracticeRecord } from '@/infrastructure/persistence/practice-repository'
import { NotebookNote } from './notebook-note'
import styles from './notebook.module.css'
export function NotebookHome({
  repositories,
  assistant,
}: {
  repositories?: Repositories
  assistant?: LearningAssistantProvider
}) {
  const [repo] = useState(() => repositories ?? createIndexedDbRepositories())
  const [notes, setNotes] = useState<NotebookEntry[]>()
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [tab, setTab] = useState(() => readNotebookView().tab ?? '词句')
  const [search, setSearch] = useState(() => readNotebookView().search ?? '')
  const [kind, setKind] = useState(() => readNotebookView().kind ?? 'all')
  const [due, setDue] = useState<string[]>([])
  const [simulations, setSimulations] = useState<PracticeSession[]>([])
  const [retained, setRetained] = useState<PracticeRecord>()
  useEffect(() => saveNotebookView({ tab, search, kind }), [tab, search, kind])
  const [inline, setInline] = useState<string>()
  useEffect(() => {
    let active = true
    void repo.notebook
      .list()
      .then(async (notes) => {
        const [heads, sessions] = await Promise.all([
          repo.learning.getReviewSchedules(notes.map((note) => note.id)),
          repo.sessions.list(),
        ])
        if (active) {
          setNotes(notes)
          setDue(
            notes
              .filter(
                (_note, index) =>
                  !heads[index] ||
                  Date.parse(heads[index]!.nextReviewAt) <= Date.now(),
              )
              .map((note) => note.id),
          )
          setSimulations(
            sessions
              .filter((session) => !!session.simulation)
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
          )
          setError('')
        }
      })
      .catch(() => {
        if (active) setError('本机记录簿暂时无法读取，请重试。')
      })
    return () => {
      active = false
    }
  }, [repo, retry])
  if (inline)
    return (
      <>
        <NotebookNote
          key={inline}
          id={inline}
          repositories={repo}
          assistant={assistant}
        />
      </>
    )
  const filtered = notes?.filter(
    (note) =>
      (kind === 'all' || note.kind === kind) &&
      `${note.text} ${note.notes} ${note.tags.join(' ')}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  )
  if (retained)
    return (
      <HistoricalPracticeRecord
        record={retained}
        repositories={repo}
        unlinked
      />
    )
  return (
    <main className={styles.page}>
      <header>
        <small>MY PHRASEBOOK</small>
        <h1 data-page-title tabIndex={-1}>
          记录簿
        </h1>
        <p>把遇到的表达，变成自己会用的话。</p>
      </header>
      <div role="tablist" aria-label="记录簿板块" className={styles.tabs}>
        {['词句', '待复习', '模拟练习'].map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      {error ? (
        <>
          <p role="alert">{error}</p>
          <button onClick={() => setRetry((n) => n + 1)}>重试读取</button>
        </>
      ) : !notes ? (
        <p role="status">正在读取记录簿…</p>
      ) : tab === '待复习' ? (
        <section role="tabpanel" aria-label="待复习">
          {notes.filter((note) => due.includes(note.id)).length ? (
            notes
              .filter((note) => due.includes(note.id))
              .map((note) => (
                <ReviewCard
                  key={note.id}
                  note={note}
                  repositories={repo}
                  assistant={assistant}
                  onCompleted={() => setRetry((n) => n + 1)}
                />
              ))
          ) : (
            <p>今天的待复习已完成</p>
          )}
        </section>
      ) : tab === '模拟练习' ? (
        <section role="tabpanel" aria-label="模拟练习">
          {simulations.length ? (
            simulations.map((session) => (
              <article className={styles.card} key={session.id}>
                <h2>{session.simulation!.target.text}</h2>
                <p>
                  来源等级 {session.level} ·{' '}
                  {session.status === 'completed'
                    ? '已完成实际流程'
                    : session.status === 'abandoned'
                      ? '已停止，未完成'
                      : session.simulation!.composition
                        ? '应用中'
                        : session.simulation!.recall
                          ? '造句中'
                          : '待回忆'}
                </p>
                {savedSimulationHref(session.id) ? (
                  <a href={savedSimulationHref(session.id)}>查看模拟练习</a>
                ) : (
                  <button
                    onClick={() =>
                      void repo.practice
                        .read(session.id)
                        .then(setRetained)
                        .catch(() => setError('保留练习暂不可读，请重试。'))
                    }
                  >
                    在此查看保留模拟
                  </button>
                )}
              </article>
            ))
          ) : (
            <p>还没有定向模拟练习</p>
          )}
          <p>从词句详情选择实际来源，开始本地覆盖的定向练习。</p>
        </section>
      ) : (
        <>
          <label>
            搜索词句与备注
            <input
              value={search}
              maxLength={200}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            筛选类型
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              <option value="all">全部词句</option>
              <option value="word">单词</option>
              <option value="phrase">短语</option>
              <option value="sentence">整句</option>
            </select>
          </label>
          {filtered?.length ? (
            filtered.map((note) => (
              <article key={note.id} className={styles.card}>
                <h2>{note.text}</h2>
                <p>{note.notes}</p>
                <small>{note.tags.join(' · ')}</small>
                <div className={styles.actions}>
                  {savedNotebookHref(note.id) ? (
                    <a href={savedNotebookHref(note.id)}>查看词句</a>
                  ) : (
                    <button onClick={() => setInline(note.id)}>
                      在此查看保留词句
                    </button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <section className={styles.card}>
              <h2>还没有符合条件的词句</h2>
              <p>在练习中点击“记录词句”，这里会保留原文和来源。</p>
              <a href="/scenes">进入场景练习</a>
            </section>
          )}
        </>
      )}
      <div className={styles.actions}>
        <a href="/practice">返回练习</a>
        <a href="/privacy">管理与导出本机数据</a>
      </div>
    </main>
  )
}
