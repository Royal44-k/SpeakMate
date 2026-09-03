import { ArrowUpRight, Clock } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import { SceneImage } from '@/components/scene-image/scene-image'
import type { AdaptedScene } from '@/domain/scenes/types'

import styles from './scene-library.module.css'

export function SceneCard({ scene }: { scene: AdaptedScene }) {
  return (
    <article className={styles.card} data-testid="scene-card">
      <SceneImage image={scene.image} />
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}><span>{scene.level} 级</span><span><Clock aria-hidden size={15} />{scene.estimatedMinutes} 分钟</span></div>
        <h2>{scene.titleZh}<small>{scene.titleEn}</small></h2>
        <p>{scene.summaryZh}</p>
        <div className={styles.cardFooter}>
          <span>{scene.keywords.length} 个关键词</span>
          <Link href={`/scenes/${scene.slug}?level=${scene.level}`} aria-label={`准备练习：${scene.titleZh}`}><ArrowUpRight aria-hidden size={21} /></Link>
        </div>
      </div>
    </article>
  )
}
