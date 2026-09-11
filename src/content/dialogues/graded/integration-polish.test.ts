import { describe, expect, it } from 'vitest'
import { localContentProvider } from './provider'

describe('Task3I named C1 editorial regressions (not general language certification)', () => {
  it.each([
    [
      'dining-01',
      'coffee.C1.drink',
      'The Americano sounds right. I am after a pronounced flavour, rather than choosing it for the caffeine.',
    ],
    [
      'dining-02',
      'restaurant-order.C1.cutlery',
      'A fork alone would suit me, thank you. I find it easier to manage the pasta that way, although I know some people prefer a spoon as well.',
    ],
    [
      'dining-04',
      'return-item.C1.carry',
      'I can manage the box myself, thank you. It is light enough for me to carry, so there is no need to trouble you.',
    ],
    [
      'dining-05',
      'supermarket-help.C1.product',
      'Rice, please. I would like to find the section first, then compare the brands and pack sizes before deciding.',
    ],
    [
      'daily-05',
      'haircut-request.C1.wash',
      'No wash for me, thank you. I would rather spend the time discussing the cut and how to look after it.',
    ],
  ])(
    'keeps the reread %s / %s form and its original single effect',
    async (sceneId, id, text) => {
      const loaded = await localContentProvider.load({ sceneId, level: 'C1' })
      if (loaded.status !== 'available') throw new Error('fixture')
      const question = loaded.pack.questions.find((q) => q.id === id)!
      const answer = question.answers.find((a) => a.text === text)
      expect(answer).toBeDefined()
      expect(answer?.acceptedForms).toEqual([text])
      expect(answer?.effects).toHaveLength(1)
      expect(question.review.record).toContain('task-3i-polish')
      expect(
        question.answers.every((a) => a.review.state === 'model-reviewed'),
      ).toBe(true)
    },
  )
})
