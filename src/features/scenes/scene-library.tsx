'use client'

import { useMemo, useRef, useState } from 'react'

import { SCENE_CATALOG } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import { ScrollToTopButton } from '@/components/app-shell/scroll-to-top-button'
import type { SceneFilterState } from './scene-filter-state'
import { sceneLibraryHref } from './scene-filter-state'
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
  const hasActiveFilters =
    state.search.trim().length > 0 ||
    state.category !== 'all' ||
    state.duration !== 'all'
  const categoryLabel =
    {
      travel: '旅行',
      dining: '餐饮',
      daily: '日常',
      work: '职场',
      social: '社交',
      study: '学习',
      emergency: '应急',
    }[state.category === 'all' ? 'travel' : state.category]
  const summaryDetails = [
    `当前 ${state.level}`,
    state.category === 'all' ? undefined : categoryLabel,
    state.duration === 'all' ? undefined : `${state.duration} 分钟`,
  ].filter(Boolean)
  const sourceHref = sceneLibraryHref(state)

  function clearFilters() {
    updateState({ search: '', category: 'all', duration: 'all' }, 'filter')
  }

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
        <p><strong>{scenes.length}</strong> 个匹配场景 · {summaryDetails.join(' · ')}</p>
        {hasActiveFilters && scenes.length > 0 ? (
          <button type="button" onClick={clearFilters}>清除筛选</button>
        ) : null}
      </div>
      <div className={styles.grid}>
        {scenes.map((scene) => (
          <SceneCard key={scene.id} scene={scene} sourceHref={sourceHref} />
        ))}
      </div>
      {scenes.length === 0 ? (
        <div className={styles.empty}>
          <h2>没有找到这个场景</h2>
          <p>当前条件下没有匹配项，清除筛选后看看全部场景。</p>
          {hasActiveFilters ? <button type="button" onClick={clearFilters}>清除筛选</button> : null}
        </div>
      ) : null}
      <ScrollToTopButton thresholdViewports={2} />
    </div>
  )
}
