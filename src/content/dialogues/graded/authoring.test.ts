import { expect, it } from 'vitest'
import { assembleQuestions } from './authoring'

it('maps authored rows without inventing forms, effects or review', () => {
  const q = assembleQuestions(
    'sample',
    'A1',
    [
      [
        'item',
        'request',
        'Tea or water?',
        '请选择',
        'tea',
        'Tea, please.',
        'water',
        'Water, please.',
      ],
    ],
    ['source'],
    'pending',
  )
  expect(q).toEqual([
    {
      id: 'sample.A1.item',
      intent: 'request',
      text: 'Tea or water?',
      hintZh: '请选择',
      objective: 'item',
      requires: [],
      sourceBasis: ['source'],
      review: { state: 'draft', record: 'pending' },
      answers: [
        {
          id: 'sample.A1.item.a',
          text: 'Tea, please.',
          acceptedForms: ['Tea, please.'],
          effects: [{ key: 'item', value: 'tea' }],
          review: { state: 'draft', record: 'pending' },
        },
        {
          id: 'sample.A1.item.b',
          text: 'Water, please.',
          acceptedForms: ['Water, please.'],
          effects: [{ key: 'item', value: 'water' }],
          review: { state: 'draft', record: 'pending' },
        },
      ],
    },
  ])
})
it('preserves explicit caller review without sharing its mutable object', () => {
  const review = {
    state: 'model-reviewed' as const,
    record: 'actual-reading.md:item',
  }
  const [q] = assembleQuestions(
    'sample',
    'B2',
    [
      [
        'item',
        'request',
        'Tea or water?',
        '请选择',
        'tea',
        'Tea, please.',
        'water',
        'Water, please.',
        review,
      ],
    ],
    ['source'],
    'pending',
  )
  review.record = 'changed'
  expect(q.review).toEqual({
    state: 'model-reviewed',
    record: 'actual-reading.md:item',
  })
  expect(q.answers.map((a) => a.review)).toEqual([q.review, q.review])
  q.review.record = 'other'
  expect(q.answers[0].review.record).toBe('actual-reading.md:item')
})
