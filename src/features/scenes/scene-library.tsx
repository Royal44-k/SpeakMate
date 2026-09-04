'use client'

import { useMemo, useState } from 'react'

import { SCENE_CATALOG } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import type { CefrLevel, SceneCategory } from '@/domain/scenes/types'

import { SceneCard } from './scene-card'
import { SceneFilters } from './scene-filters'
import styles from './scene-library.module.css'

export type DurationFilter = 'all' | 3 | 5 | 8 | 10

export function SceneLibrary({ initialLevel = 'A2' }: { initialLevel?: CefrLevel }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<SceneCategory | 'all'>('all')
  const [level, setLevel] = useState<CefrLevel>(initialLevel)
  const [duration, setDuration] = useState<DurationFilter>('all')

  const scenes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return SCENE_CATALOG.filter((scene) => {
      if (category !== 'all' && scene.category !== category) return false
      if (duration !== 'all' && scene.estimatedMinutes !== duration) return false
      if (!query) return true
      return [scene.titleZh, scene.titleEn, ...scene.keywords[level]]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query)
    }).map((scene) => adaptScene(scene, level))
  }, [category, duration, level, search])

  return (
    <div className={styles.library}>
      <header className={styles.header}>
        <p>SITUATIONS</p>
        <h1>把英语练进生活里</h1>
        <span>42 个真实对话场景</span>
      </header>
      <SceneFilters search={search} category={category} level={level} duration={duration} onSearch={setSearch} onCategory={setCategory} onLevel={setLevel} onDuration={setDuration} />
      <div className={styles.resultBar}><strong>{scenes.length}</strong><span>个匹配场景 · 当前 {level}</span></div>
      <div className={styles.grid}>
        {scenes.map((scene) => <SceneCard key={scene.id} scene={scene} />)}
      </div>
      {scenes.length === 0 ? <div className={styles.empty}><h2>没有找到这个场景</h2><p>换个关键词，或清除分类后再试。</p></div> : null}
    </div>
  )
}
