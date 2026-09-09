import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useRef, useState } from 'react'

import {
  CEFR_LEVELS,
  type CefrLevel,
  type SceneCategory,
} from '@/domain/scenes/types'

import styles from './scene-library.module.css'
import type { DurationFilter } from './scene-filter-state'
import { HorizontalFilterGroup } from './horizontal-filter-group'

const categories: Array<{ value: SceneCategory | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'travel', label: '旅行' },
  { value: 'dining', label: '餐饮' },
  { value: 'daily', label: '日常' },
  { value: 'work', label: '职场' },
  { value: 'social', label: '社交' },
  { value: 'study', label: '学习' },
  { value: 'emergency', label: '应急' },
]

export function SceneFilters({
  search,
  category,
  level,
  duration,
  onSearch,
  onSubmitSearch,
  onCategory,
  onLevel,
  onDuration,
}: {
  search: string
  category: SceneCategory | 'all'
  level: CefrLevel
  duration: DurationFilter
  onSearch(value: string): void
  onSubmitSearch(value: string): void
  onCategory(value: SceneCategory | 'all'): void
  onLevel(value: CefrLevel): void
  onDuration(value: DurationFilter): void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [composition, setComposition] = useState<string | null>(null)
  return (
    <div className={styles.filters}>
      <form
        className={styles.search}
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          if (composition === null) onSubmitSearch(search)
        }}
      >
        <label className={styles.srOnly} htmlFor="scene-search">
          搜索场景
        </label>
        <input
          id="scene-search"
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          aria-label="搜索场景"
          value={composition ?? search}
          onCompositionStart={(event) =>
            setComposition(event.currentTarget.value)
          }
          onCompositionEnd={(event) => {
            setComposition(null)
            onSearch(event.currentTarget.value)
          }}
          onChange={(event) =>
            composition === null
              ? onSearch(event.target.value)
              : setComposition(event.target.value)
          }
          placeholder="搜场景、需求或关键词"
        />
        <button
          type="button"
          aria-label="清空搜索"
          className={styles.clearSearch}
          disabled={!search && !composition}
          onClick={() => {
            setComposition(null)
            onSubmitSearch('')
            inputRef.current?.focus()
          }}
        >
          <X aria-hidden size={19} />
        </button>
        <button type="submit" className={styles.submitSearch} aria-label="搜索">
          <MagnifyingGlass aria-hidden size={18} />
          <span>搜索</span>
        </button>
      </form>
      <HorizontalFilterGroup label="场景分类" selectedValue={category}>
        {categories.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={category === item.value}
            className={
              category === item.value ? styles.chipActive : styles.chip
            }
            onClick={() => onCategory(item.value)}
          >
            {item.label}
          </button>
        ))}
      </HorizontalFilterGroup>
      <div className={styles.levels} aria-label="英语水平">
        {CEFR_LEVELS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={level === item}
            className={level === item ? styles.levelActive : styles.level}
            onClick={() => onLevel(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <HorizontalFilterGroup label="练习时长" selectedValue={duration}>
        {(['all', 3, 5, 8, 10] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={duration === item}
            className={
              duration === item ? styles.durationActive : styles.duration
            }
            onClick={() => onDuration(item)}
          >
            {item === 'all' ? '全部时长' : `${item} 分钟`}
          </button>
        ))}
      </HorizontalFilterGroup>
    </div>
  )
}
