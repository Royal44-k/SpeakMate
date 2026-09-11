import { describe, expect, it } from 'vitest'
import { SCENE_CATALOG } from './catalog'
import { SCENE_METADATA, getSceneMetadata } from './metadata'

describe('lightweight scene display contract', () => {
  it('preserves all42identities, display versions and existing media without importing graded prose', () => {
    expect(SCENE_METADATA).toHaveLength(42)
    for (const old of SCENE_CATALOG) {
      const metadata = getSceneMetadata(old.slug)!
      expect(metadata).toMatchObject({
        id: old.id,
        version: old.version,
        category: old.category,
        image: old.image,
      })
      expect(metadata).not.toHaveProperty('openingLines')
      expect(metadata).not.toHaveProperty('goals')
      expect(metadata).not.toHaveProperty('constraints')
    }
  })
  it('uses the approved Chinese study heading and communication-only emergency summaries', () => {
    expect(getSceneMetadata('office-hours')?.titleZh).toBe('老师答疑')
    expect(getSceneMetadata('pharmacy-medicine')?.summaryZh).toContain('演练')
    expect(getSceneMetadata('lost-property')?.summaryZh).toContain('未发送')
  })
})
