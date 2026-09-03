import { ArrowRight, Clock, Headphones, Sparkle } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import { AppShell } from '@/components/app-shell/app-shell'
import { SceneImage } from '@/components/scene-image/scene-image'
import { getSceneBySlug } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'

import styles from './practice-home.module.css'

export const metadata = { title: '今日练习' }

export default function PracticePage() {
  const scene = adaptScene(getSceneBySlug('hotel-check-in')!, 'B1')
  return (
    <AppShell activeDestination="practice">
      <div className={styles.page}>
        <header className={styles.header}><div><p>GOOD EVENING</p><h1>今天，开口<br />说 5 分钟</h1></div><span>B1</span></header>
        <section className={styles.recommendation} aria-labelledby="recommendation-title">
          <div className={styles.image}><SceneImage image={scene.image} priority /><span><Sparkle aria-hidden size={16} weight="fill" />今日推荐</span></div>
          <div className={styles.body}>
            <p>{scene.titleEn}</p><h2 id="recommendation-title">{scene.titleZh}</h2>
            <div className={styles.meta}><span><Clock aria-hidden size={16} />{scene.estimatedMinutes} 分钟</span><span><Headphones aria-hidden size={16} />{scene.recommendedTurns} 轮</span></div>
            <p className={styles.summary}>{scene.summaryZh}</p>
            <Link href={`/scenes/${scene.slug}?level=${scene.level}`}>准备开始<ArrowRight aria-hidden size={20} weight="bold" /></Link>
          </div>
        </section>
        <section className={styles.explore}><div><p>还想练点别的？</p><h2>42 个场景，覆盖生活里的每一次开口。</h2></div><Link href="/scenes">浏览全部场景</Link></section>
      </div>
    </AppShell>
  )
}
