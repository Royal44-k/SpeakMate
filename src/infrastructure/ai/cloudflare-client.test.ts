import { expect, it } from 'vitest'
import { getSceneBySlug } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import {
  generateWithCloudflare,
  type CloudflareAiConfig,
} from './cloudflare-client'

it('rejects an exact repeated AI reply so the provider can use a fresh guided response', async () => {
  const scene = adaptScene(getSceneBySlug('coffee-order')!, 'C1')
  const repeated = 'Would you prefer hot or iced coffee?'
  const fetchImpl = async () =>
    new Response(
      JSON.stringify({
        success: true,
        result: {
          response: JSON.stringify({
            reply: { text: repeated, hintZh: '请选择。', emotion: 'warm' },
            feedback: {
              heard: 'Iced, please.',
              corrected: null,
              naturalAlternative: null,
              explanationZh: '继续。',
              issueTags: [],
            },
            progress: { completedGoalIds: [], shouldOfferCompletion: false },
          }),
        },
      }),
    )
  const config: CloudflareAiConfig = {
    accountId: 'test',
    apiToken: 'test',
    asrModel: '@cf/openai/whisper',
    llmModel: '@cf/zai-org/glm-4.7-flash',
  }
  await expect(
    generateWithCloudflare(
      {
        scene,
        learnerText: 'Iced, please.',
        history: [{ speaker: 'ai', text: repeated }],
        completedGoalIds: [],
        turnIndex: 1,
      },
      config,
      fetchImpl,
    ),
  ).rejects.toThrow(/repeat/i)
})
