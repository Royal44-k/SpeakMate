/* eslint-disable @next/next/no-html-link-for-pages -- Binding offline-routing contract: cross-shell learning links require document navigation, never RSC prefetch. */
import { buildLearningHref } from '@/components/app-shell/learning-routes'
import { SCENE_METADATA } from '@/content/scenes/metadata'
import type { PracticeRecord } from '@/infrastructure/persistence/practice-repository'
import styles from './session-report.module.css'
import type { ReactNode } from 'react'

/** Read-only original transcript; never invokes the retired engine or grades old goals. */
export function HistoricalPracticeRecord({
  record,
  children,
  unlinked = false,
}: {
  record: PracticeRecord
  children?: ReactNode
  unlinked?: boolean
}) {
  const { session, turns } = record
  const scene = SCENE_METADATA.find((item) => item.id === session.sceneId)
  const Root = unlinked ? 'section' : 'main'
  return (
    <Root className={styles.report}>
      <h1 data-page-title tabIndex={-1}>
        {unlinked ? '保留的练习记录（只读）' : '旧版练习记录（只读）'}
      </h1>
      <h2>{session.sceneSnapshot?.titleZh ?? scene?.titleZh ?? '历史场景'}</h2>
      <p>
        {session.level} ·{' '}
        {session.status === 'completed'
          ? '当时已结束'
          : session.status === 'abandoned'
            ? '当时已停止'
            : '当时未结束'}
        。
        {unlinked
          ? '此编号不能直接链接或从此路由续练。此处只读展示原文、时间和当时保存的反馈；另行开始新版练习不会改写本记录或引用。'
          : '旧版流程不再继续运行；原文、时间和当时保存的反馈仍保留，不换成新题库，也不把旧关键词目标算作新版确认事实。'}
      </p>
      {unlinked ? (
        <>
          {record.status === 'recovery' ? (
            <p role="alert">
              {record.message ??
                '保存状态需要检查；这里只读保留原文，不执行或修复该记录。'}
            </p>
          ) : null}
          <a href="/privacy">导出本机备份</a>
        </>
      ) : null}
      <p>
        开始：{session.startedAt}；最后保存：{session.updatedAt}
      </p>
      {session.openingText ? (
        <section>
          <h2>当时开场</h2>
          <p lang="en">{session.openingText}</p>
        </section>
      ) : (
        <p>当时没有保存开场文字，不从当前目录补写。</p>
      )}
      {turns.map((turn) => {
        const feedback = turn.result?.feedback ?? turn.feedback
        return (
          <section key={turn.id}>
            <h2>第 {turn.index + 1} 轮</h2>
            <p>你</p>
            <p lang="en">{turn.learnerText}</p>
            <p>当时回复</p>
            <p lang="en">{turn.aiText}</p>
            {feedback ? (
              <details>
                <summary>当时的规则反馈（非新版评估）</summary>
                <p>{feedback.explanationZh}</p>
                {feedback.corrected ? <p>{feedback.corrected}</p> : null}
              </details>
            ) : null}
          </section>
        )
      })}
      {scene ? (
        <a
          href={buildLearningHref({
            kind: 'prepare',
            scene: scene.slug,
            level: session.level,
          })}
        >
          开始新版练习
        </a>
      ) : (
        <a href="/scenes">选择新版场景</a>
      )}
      {children}
      <nav className={styles.actions} aria-label="复盘后操作">
        <a href="/me">返回我的练习</a>
        <a href="/practice">回到今日练习</a>
        <a href="/scenes">换个场景</a>
      </nav>
    </Root>
  )
}
