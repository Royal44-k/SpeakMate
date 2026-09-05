'use client'

import { useMemo, useRef, useState } from 'react'

import { SCENE_CATALOG } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import type { SceneFilterState } from './scene-filter-state'
import { SceneCard } from './scene-card'
import { SceneFilters } from './scene-filters'
import styles from './scene-library.module.css'

interface SceneLibraryProps {
  initialState: SceneFilterState
  onStateChange?(state: SceneFilterState, source: 'search' | 'filter'): void
}

export function SceneLibrary({
  initialState,
  onStateChange,
}: SceneLibraryProps) {
  const [state, setState] = useState(initialState)
  const stateRef = useRef(initialState)

  function updateState(
    patch: Partial<SceneFilterState>,
    source: 'search' | 'filter',
  ) {
    const next = { ...stateRef.current, ...patch }
    stateRef.current = next
    setState(next)
    onStateChange?.(next, source)
  }

  const scenes = useMemo(() => {
    const query = state.search.trim().toLocaleLowerCase()
    return SCENE_CATALOG.filter((scene) => {
      if (state.category !== 'all' && scene.category !== state.category)
        return false
      if (state.duration !== 'all' && scene.estimatedMinutes !== state.duration)
        return false
      if (!query) return true
      return [scene.titleZh, scene.titleEn, ...scene.keywords[state.level]]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query)
    }).map((scene) => adaptScene(scene, state.level))
  }, [state])

  return (
    <div className={styles.library}>
      <header className={styles.header}>
        <p>SITUATIONS</p>
        <h1>把英语练进生活里</h1>
        <span>42 个真实对话场景</span>
      </header>
      <SceneFilters
        search={state.search}
        category={state.category}
        level={state.level}
        duration={state.duration}
        onSearch={(search) => updateState({ search }, 'search')}
        onCategory={(category) => updateState({ category }, 'filter')}
        onLevel={(level) => updateState({ level }, 'filter')}
        onDuration={(duration) => updateState({ duration }, 'filter')}
      />
      <div className={styles.resultBar}>
        <strong>{scenes.length}</strong>
        <span>个匹配场景 · 当前 {state.level}</span>
      </div>
      <div className={styles.grid}>
        {scenes.map((scene) => (
          <SceneCard key={scene.id} scene={scene} />
        ))}
      </div>
      {scenes.length === 0 ? (
        <div className={styles.empty}>
          <h2>没有找到这个场景</h2>
          <p>换个关键词，或清除分类后再试。</p>
        </div>
      ) : null}
    </div>
  )
}
