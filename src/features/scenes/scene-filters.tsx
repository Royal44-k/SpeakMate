import { MagnifyingGlass } from '@phosphor-icons/react'

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
  onCategory,
  onLevel,
  onDuration,
}: {
  search: string
  category: SceneCategory | 'all'
  level: CefrLevel
  duration: DurationFilter
  onSearch(value: string): void
  onCategory(value: SceneCategory | 'all'): void
  onLevel(value: CefrLevel): void
  onDuration(value: DurationFilter): void
}) {
  return (
    <div className={styles.filters}>
      <label className={styles.search}>
        <MagnifyingGlass aria-hidden size={20} />
        <span className={styles.srOnly}>搜索场景</span>
        <input
          aria-label="搜索场景"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="搜索中文、英文或关键词"
        />
      </label>
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
