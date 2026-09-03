import Image from 'next/image'

import type { SceneImage as SceneImageDescriptor } from '@/domain/scenes/types'

import styles from './scene-image.module.css'

const sceneSources: Record<string, string> = {
  travel: '/scenes/travel.webp',
  dining: '/scenes/dining.webp',
  daily: '/scenes/daily.webp',
  work: '/scenes/work.webp',
  social: '/scenes/social.webp',
  study: '/scenes/study.webp',
  emergency: '/scenes/emergency.webp',
  hotel: '/scenes/hotel.webp',
}

export function SceneImage({
  image,
  priority = false,
}: {
  image: SceneImageDescriptor
  priority?: boolean
}) {
  const src = sceneSources[image.key] ?? sceneSources.travel
  return (
    <span className={styles.frame}>
      <Image
        src={src}
        alt={image.altZh}
        fill
        priority={priority}
        sizes="(max-width: 480px) 100vw, 480px"
        style={{ objectPosition: image.focalPoint }}
      />
    </span>
  )
}
