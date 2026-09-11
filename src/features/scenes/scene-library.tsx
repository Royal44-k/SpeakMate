'use client'

import { useMemo, useState } from 'react'

import { SCENE_METADATA } from '@/content/scenes/metadata'
import { searchScenes } from '@/domain/scenes/search-scenes'
import type { CefrLevel } from '@/domain/scenes/types'
import { ScrollToTopButton } from '@/components/app-shell/scroll-to-top-button'
import type { SceneFilterState } from './scene-filter-state'
import { sceneLibraryHref, sceneFilterIdentity } from './scene-filter-state'
import { SceneCard } from './scene-card'
import { SceneFilters } from './scene-filters'
import styles from './scene-library.module.css'

interface SceneLibraryProps {
  initialState: SceneFilterState
  onStateChange?(state: SceneFilterState, source: 'search' | 'filter'): void
  onLevelChange?(level: CefrLevel): void
}

export function SceneLibrary({
  initialState,
  onStateChange,
  onLevelChange,
}: SceneLibraryProps) {
  const [state, setState] = useState(initialState)
  const incomingHref = sceneFilterIdentity(initialState)
  const [lastIncomingHref, setLastIncomingHref] = useState(incomingHref)

  if (incomingHref !== lastIncomingHref) {
    setLastIncomingHref(incomingHref)
    if (sceneFilterIdentity(state) !== incomingHref) {
      setState(initialState)
    }
  }

  function updateState(
    patch: Partial<SceneFilterState>,
    source: 'search' | 'filter',
  ) {
    const next = { ...state, ...patch }
    setState(next)
    onStateChange?.(next, source)
  }

  const scenes = useMemo(() => {
    return searchScenes(SCENE_METADATA, state.search)
      .filter((scene) => {
        if (state.category !== 'all' && scene.category !== state.category)
          return false
        if (
          state.duration !== 'all' &&
          scene.estimatedMinutes !== state.duration
        )
          return false
        return true
      })
      .map((scene) => ({ ...scene, level: state.level }))
  }, [state])
  const hasActiveFilters =
    state.search.trim().length > 0 ||
    state.category !== 'all' ||
    state.duration !== 'all'
  const categoryLabel = {
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
        <h1 data-page-title tabIndex={-1}>
          把英语练进生活里
        </h1>
        <span>42 个真实对话场景</span>
      </header>
      <SceneFilters
        search={state.search}
        category={state.category}
        level={state.level}
        duration={state.duration}
        onSearch={(search) => updateState({ search }, 'search')}
        onSubmitSearch={(search) => updateState({ search }, 'filter')}
        onCategory={(category) => updateState({ category }, 'filter')}
        onLevel={(level) => {
          updateState({ level }, 'filter')
          onLevelChange?.(level)
        }}
        onDuration={(duration) => updateState({ duration }, 'filter')}
      />
      <div className={styles.resultBar}>
        <p role="status" aria-live="polite">
          <strong>{scenes.length}</strong> 个匹配场景 ·{' '}
          {summaryDetails.join(' · ')}
        </p>
        {hasActiveFilters && scenes.length > 0 ? (
          <button type="button" onClick={clearFilters}>
            清除筛选
          </button>
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
          {hasActiveFilters ? (
            <button type="button" onClick={clearFilters}>
              清除筛选
            </button>
          ) : null}
        </div>
      ) : null}
      <ScrollToTopButton thresholdViewports={2} />
    </div>
  )
}
