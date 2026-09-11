import { expect, it } from 'vitest'
import metadata from './goal-path-metadata.json'
import { gradedSceneManifest } from './dialogues/graded/manifest'
import { localContentProvider } from './dialogues/graded/provider'

it('contains every actual ordinary variant/mode path and no authored prose', async () => {
  const actual = []
  for (const scene of gradedSceneManifest)
    for (const level of scene.levels) {
      const loaded = await localContentProvider.load({
        sceneId: scene.sceneId,
        level,
      })
      if (loaded.status !== 'available')
        throw new Error('Missing ordinary pack')
      for (const variant of loaded.pack.variants)
        actual.push({
          sceneId: scene.sceneId,
          level,
          contentVersion: loaded.pack.contentVersion,
          variantId: variant.id,
          modes: {
            short: variant.modes.short.questionIds.length,
            standard: variant.modes.standard.questionIds.length,
            extended: variant.modes.extended.questionIds.length,
          },
        })
    }
  expect(metadata).toEqual(actual)
})
