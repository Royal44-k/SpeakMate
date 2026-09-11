import { ArrowUpRight, Clock } from '@phosphor-icons/react/dist/ssr'
import { buildLearningHref } from '@/components/app-shell/learning-routes'

import { SceneImage } from '@/components/scene-image/scene-image'
import type { CefrLevel } from '@/domain/scenes/types'
import type { SceneMetadata } from '@/content/scenes/metadata'

import styles from './scene-library.module.css'

export function SceneCard({
  scene,
  sourceHref,
}: {
  scene: SceneMetadata & { level: CefrLevel }
  sourceHref: string
}) {
  const href = buildLearningHref({
    kind: 'prepare',
    scene: scene.slug,
    level: scene.level,
    from: sourceHref,
  })

  return (
    <a
      className={styles.cardLink}
      href={href}
      aria-label={`准备练习：${scene.titleZh}`}
    >
      <article className={styles.card} data-testid="scene-card">
        <SceneImage image={scene.image} />
        <div className={styles.cardBody}>
          <div className={styles.cardMeta}>
            <span>{scene.level} 级</span>
            <span>
              <Clock aria-hidden size={15} />
              {scene.estimatedMinutes} 分钟
            </span>
          </div>
          <h2>
            {scene.titleZh}
            <small>{scene.titleEn}</small>
          </h2>
          <p>{scene.summaryZh}</p>
          <div className={styles.cardFooter}>
            <span>3 种练习长度</span>
            <span className={styles.cardArrow}>
              <ArrowUpRight aria-hidden size={21} />
            </span>
          </div>
        </div>
      </article>
    </a>
  )
}
