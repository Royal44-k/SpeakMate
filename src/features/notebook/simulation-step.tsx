'use client'
import type { PracticeSimulation } from '@/domain/practice/types'
import type { SimulationDraft } from '@/features/practice/use-practice-session'
import { ExitGuard } from '@/features/practice/exit-guard'
import styles from './notebook.module.css'
export function SimulationStep({
  simulation,
  busy,
  error,
  onSubmit,
  onReload,
  onDraftChange,
  draft,
  active,
  reloading,
  onDiscard,
}: {
  simulation: PracticeSimulation
  busy: boolean
  error?: string
  onSubmit: (text: string, phase: SimulationDraft['phase']) => Promise<boolean>
  onReload: () => Promise<void>
  onDraftChange: (phase: SimulationDraft['phase'], text: string) => void
  draft?: SimulationDraft
  active: boolean
  reloading: boolean
  onDiscard: () => void
}) {
  const text = draft?.text ?? ''
  const phase = draft?.phase ?? (simulation.recall ? 'compose' : 'recall')
  const compose = phase === 'compose'
  const staleDraft =
    !!text &&
    (!active || !!simulation.composition || compose !== !!simulation.recall)
  return (
    <main className={styles.page}>
      <ExitGuard
        state={busy ? 'processing' : text ? 'draft' : 'clean'}
        fallbackHref={simulation.returnTo}
        onConfirmExit={onDiscard}
      />
      <small>定向练习 · {compose ? '2 / 3 造句' : '1 / 3 回忆'}</small>
      <h1 data-page-title tabIndex={-1}>
        {compose ? '换一种说法，自己造句' : '先回忆，再查看原文'}
      </h1>
      <p>{simulation.target.meaningZh}</p>
      {compose ? (
        <section className={styles.card}>
          <h2>原表达与校审示例</h2>
          <p lang="en">{simulation.target.text}</p>
          <p>我的回忆：{simulation.recall!.text}</p>
          <p>同来源等级示例：{simulation.target.example}</p>
          <p>替换示例：{simulation.target.substitution}</p>
          <p>这是参考资料，不是对你回忆或造句的正确性评分。</p>
        </section>
      ) : (
        <p>
          答案暂时隐藏。按自己的记忆写下表达；想不起来也可以如实写出自己的回忆情况，再查看原文。
        </p>
      )}
      <label>
        {compose ? '我的替换或造句' : '我回忆的表达'}
        <textarea
          value={text}
          maxLength={20000}
          disabled={busy}
          onChange={(event) => {
            onDraftChange(phase, event.target.value)
          }}
        />
      </label>
      {staleDraft ? (
        <p role="alert">
          本机保存的阶段已变化。这份输入仍保留为原来的
          {compose ? '造句' : '回忆'}
          草稿，不会当作其他步骤的答案；可保留并复制文字，或明确取消本次输入后查看最新进度。
        </p>
      ) : null}
      <button
        disabled={busy || !text.trim() || staleDraft}
        onClick={() => void onSubmit(text, phase)}
      >
        {compose ? '保存造句并应用' : '保存回忆并查看'}
      </button>
      <button disabled={busy} onClick={onDiscard}>
        取消本次输入
      </button>
      {error ? (
        <>
          <p role="alert">{error}</p>
          <button disabled={busy || reloading} onClick={() => void onReload()}>
            读取最新进度
          </button>
        </>
      ) : null}
      <a href={simulation.returnTo}>返回词句或记录簿</a>
    </main>
  )
}
