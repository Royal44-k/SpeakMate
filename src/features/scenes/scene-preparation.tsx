'use client'

import { ArrowRight, Clock } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { MobilePageHeader } from '@/components/app-shell/mobile-page-header'
import {
  buildLearningHref,
  safeSourceHref,
} from '@/components/app-shell/learning-routes'
import { useOfflineReadiness } from '@/components/app-shell/offline-readiness'
import { SceneImage } from '@/components/scene-image/scene-image'
import type { SceneMetadata } from '@/content/scenes/metadata'
import { publicContentProvider } from '@/content/public-category'
import { selectedPracticePresentation } from '@/content/scenes/practice-presentation'
import type {
  GradedPack,
  DialogueMode,
} from '@/content/dialogues/graded/schema'
import type { CefrLevel } from '@/domain/scenes/types'
import { createDialogue } from '@/domain/ai/graded-dialogue'
import styles from './scene-preparation.module.css'

export const practiceLengths = {
  short: { label: '简短', turns: 3, minutes: '约 3–5 分钟' },
  standard: { label: '标准', turns: 6, minutes: '约 5–8 分钟' },
  extended: { label: '深入', turns: 10, minutes: '约 8–12 分钟' },
} as const
export function ScenePreparation({
  scene,
  backHref,
  mode = 'standard',
}: {
  scene: SceneMetadata & { level: CefrLevel }
  backHref: string
  mode?: DialogueMode
}) {
  const [selectedMode, setSelectedMode] = useState(mode)
  const [loaded, setLoaded] = useState<{
    key: string
    pack?: GradedPack
    error?: string
  }>()
  const [attempt, setAttempt] = useState(0)
  const key = `${scene.id}:${scene.level}`
  const pack = loaded?.key === key ? loaded.pack : undefined
  const error = loaded?.key === key ? loaded.error : undefined
  const readiness = useOfflineReadiness(scene.category, loaded)
  useEffect(() => {
    let active = true
    void publicContentProvider()
      .load({ sceneId: scene.id, level: scene.level })
      .then((result) => {
        if (
          result.status !== 'available' ||
          result.pack.sceneId !== scene.id ||
          result.pack.level !== scene.level
        )
          throw new Error('所选场景或等级不可用')
        if (active) setLoaded({ key, pack: result.pack })
      })
      .catch((failure: unknown) => {
        if (active)
          setLoaded({
            key,
            error: `此分类下载或读取失败，未替换为其他语料。已保存的练习仍可用原快照恢复。${failure instanceof Error ? failure.message : '请检查联网后重试。'}`,
          })
      })
    return () => {
      active = false
    }
  }, [key, scene.id, scene.level, attempt])
  const variant = pack?.variants[0]
  const presentation =
    pack && variant ? selectedPracticePresentation(pack, variant.id) : undefined
  const start =
    pack && variant
      ? createDialogue(pack, { mode: selectedMode, variantId: variant.id })
      : undefined
  const source = safeSourceHref(backHref) ?? `/scenes?level=${scene.level}`
  return (
    <article className={styles.preparation}>
      <MobilePageHeader
        title={scene.titleZh}
        eyebrow="SCENE BRIEF"
        fallbackHref={source}
      />
      <div className={styles.hero}>
        <SceneImage image={scene.image} priority />
        <div className={styles.heroMeta}>
          <span>{scene.category.toUpperCase()}</span>
          <span>{scene.level}</span>
        </div>
      </div>
      <header className={styles.intro}>
        <p>{scene.titleEn}</p>
        <h2 className={styles.sceneTitle}>{scene.titleZh}</h2>
        <div className={styles.duration}>
          <Clock aria-hidden size={17} />
          {practiceLengths[selectedMode].minutes} · 约{' '}
          {practiceLengths[selectedMode].turns} 轮
        </div>
      </header>
      <p className={styles.summary}>{scene.summaryZh}</p>
      <fieldset className={styles.lengths}>
        <legend>选择练习长度</legend>
        {(Object.keys(practiceLengths) as DialogueMode[]).map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="length"
              value={value}
              checked={selectedMode === value}
              onChange={() => {
                setSelectedMode(value)
                if (window.location.pathname === '/scenes/prepare')
                  window.history.replaceState(
                    null,
                    '',
                    buildLearningHref({
                      kind: 'prepare',
                      scene: scene.slug,
                      level: scene.level,
                      mode: value,
                      from: source,
                    }),
                  )
              }}
            />
            <span>
              {practiceLengths[value].label} · 约 {practiceLengths[value].turns}{' '}
              轮<br />
              {practiceLengths[value].minutes}
            </span>
          </label>
        ))}
      </fieldset>
      <p role="status">
        {process.env.NODE_ENV !== 'production'
          ? '开发模式：资料可用于本地开发，不代表已通过生产离线验证。'
          : null}
        {readiness?.shell
          ? '本版页面与共享资源已验证缓存。'
          : '页面离线准备尚未确认。'}{' '}
        {readiness?.content ? '此分类已验证缓存。' : '此分类离线缓存尚未确认。'}{' '}
        缓存可能被浏览器清理；已保存的对话快照与公开分类下载分别管理。
      </p>
      {error ? (
        <section role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoaded(undefined)
              setAttempt((value) => value + 1)
            }}
          >
            重试下载此分类
          </button>
          <a href="/practice">返回今日练习检查更新</a>
        </section>
      ) : !pack ? (
        <p role="status">正在下载或读取此公开分类，不发送你的文字或录音…</p>
      ) : null}
      {pack && variant && presentation ? (
        <>
          <section aria-labelledby="role-title">
            <h2 id="role-title">{presentation.counterpartZh}</h2>
            <p>{presentation.frameZh}</p>
            <p className={styles.material}>{variant.situationZh}</p>
          </section>
          <section>
            <h2>本级表达练习</h2>
            <p>{pack.rationale.canDoZh}</p>
            <p>{pack.rationale.complexityZh}</p>
            <p>{pack.rationale.scaffoldingZh}</p>
            <p>{pack.rationale.registerZh}</p>
          </section>
          <section>
            <h2>何时结束</h2>
            <p>
              所选流程最多 {variant.modes[selectedMode].questionIds.length}{' '}
              次提交，帮助、未收录表达和改答也占用轮次。到上限且至少一次非空表达，或所选流程确实达成后，可自行确认结束。部分结束与目标达成分别记录，不按语言分数判定；只求助或停止不算完成。
            </p>
            <p>
              暂时离开可稍后继续；“停止本次练习”会明确结束当前流程，不影响已有记录。普通回答中的
              No 或婉拒不会被当作停止。
            </p>
          </section>
          <section>
            <h2>开场问题</h2>
            <blockquote lang="en">{start!.reply}</blockquote>
            <p>进入后查看本题的两条参考表达，也可直接确认自己的文字。</p>
          </section>
          <a
            className={styles.start}
            href={buildLearningHref({
              kind: 'session',
              id: 'new',
              scene: scene.slug,
              level: scene.level,
              mode: selectedMode,
              from: source,
            })}
          >
            进入对话舞台
            <ArrowRight aria-hidden size={21} />
          </a>
        </>
      ) : null}
    </article>
  )
}
