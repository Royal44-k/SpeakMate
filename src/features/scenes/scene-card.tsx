import { ArrowUpRight, Clock } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import { SceneImage } from '@/components/scene-image/scene-image'
import type { AdaptedScene } from '@/domain/scenes/types'

import styles from './scene-library.module.css'

export function SceneCard({
  scene,
  sourceHref,
}: {
  scene: AdaptedScene
  sourceHref: string
}) {
  const href = `/scenes/${scene.slug}?level=${scene.level}&from=${encodeURIComponent(sourceHref)}`

  return (
    <Link
      className={styles.cardLink}
      href={href}
      aria-label={`准备练习：${scene.titleZh}`}
    >
      <article className={styles.card} data-testid="scene-card">
        <SceneImage image={scene.image} />
        <div className={styles.cardBody}>
          <div className={styles.cardMeta}><span>{scene.level} 级</span><span><Clock aria-hidden size={15} />{scene.estimatedMinutes} 分钟</span></div>
          <h2>{scene.titleZh}<small>{scene.titleEn}</small></h2>
          <p>{scene.summaryZh}</p>
          <div className={styles.cardFooter}>
            <span>{scene.keywords.length} 个关键词</span>
            <span className={styles.cardArrow}><ArrowUpRight aria-hidden size={21} /></span>
          </div>
        </div>
      </article>
    </Link>
  )
}
