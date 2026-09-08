import { ArrowRight, CheckCircle, Clock, UserFocus } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import { MobilePageHeader } from '@/components/app-shell/mobile-page-header'
import { SceneImage } from '@/components/scene-image/scene-image'
import type { AdaptedScene } from '@/domain/scenes/types'

import styles from './scene-preparation.module.css'

export function ScenePreparation({
  scene,
  backHref,
}: {
  scene: AdaptedScene
  backHref: string
}) {
  return (
    <article className={styles.preparation}>
      <MobilePageHeader
        title={scene.titleZh}
        eyebrow="SCENE BRIEF"
        fallbackHref={backHref}
      />
      <div className={styles.hero}>
        <SceneImage image={scene.image} priority />
        <div className={styles.heroMeta}><span>{scene.category.toUpperCase()}</span><span>{scene.level}</span></div>
      </div>
      <header className={styles.intro}>
        <p>{scene.titleEn}</p>
        <h2 className={styles.sceneTitle}>{scene.titleZh}</h2>
        <div className={styles.duration}><Clock aria-hidden size={17} />约 {scene.estimatedMinutes} 分钟 · 建议 {scene.recommendedTurns} 轮</div>
      </header>
      <p className={styles.summary}>{scene.summaryZh}</p>

      <section aria-labelledby="role-title">
        <div className={styles.sectionTitle}><UserFocus aria-hidden size={20} /><h2 id="role-title">角色设定</h2></div>
        <dl className={styles.roles}><div><dt>你</dt><dd>{scene.learnerRole}</dd></div><div><dt>AI</dt><dd>{scene.aiRole}</dd></div></dl>
      </section>

      <section aria-labelledby="goal-title">
        <div className={styles.sectionTitle}><CheckCircle aria-hidden size={20} /><h2 id="goal-title">本次任务</h2></div>
        <ol className={styles.goals}>{scene.goals.map((goal) => <li key={goal.id}>{goal.labelZh}</li>)}</ol>
      </section>

      <section aria-labelledby="support-title">
        <div className={styles.sectionTitle}><h2 id="support-title">开口提示</h2></div>
        <div className={styles.keywords}>{scene.keywords.map((word) => <span key={word}>{word}</span>)}</div>
        <div className={styles.examples}>{scene.exampleExpressions.map((expression) => <blockquote key={expression}>“{expression}”</blockquote>)}</div>
      </section>

      {scene.safetyNote ? <aside className={styles.safety}>{scene.safetyNote}</aside> : null}

      <Link
        className={styles.start}
        href={`/session/new?scene=${scene.slug}&level=${scene.level}&from=${encodeURIComponent(backHref)}`}
      >
        进入对话舞台<ArrowRight aria-hidden size={21} weight="bold" />
      </Link>
    </article>
  )
}
