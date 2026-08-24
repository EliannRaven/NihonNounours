import { describe, expect, it } from 'vitest'
import { getTimelineForDate } from '../../lib/tripData'
import type { TimelineItem } from '../../types/trip'
import { getTimelineAction } from './timelineAction'

function item(overrides: Partial<TimelineItem> = {}): TimelineItem {
  return {
    type: 'food',
    reference: null,
    title: 'Flexible slot',
    city: 'Kamakura',
    area: 'Hase',
    startTime: null,
    endTime: null,
    durationMin: null,
    status: 'Flexible',
    info: null,
    important: null,
    ...overrides,
  }
}

describe('timeline action resolver', () => {
  it('returns a discovery action for a synthetic Activities slot', () => {
    const discovery = {
      mode: 'activities',
      city: 'Kamakura',
      area: 'Hase',
    } as const

    expect(getTimelineAction(item({ discovery }))).toEqual({
      kind: 'discovery',
      discovery,
    })
  })

  it('gives a valid entity action precedence over discovery', () => {
    const action = getTimelineAction(
      item({
        type: 'activity',
        reference: 'ACT015',
        discovery: { mode: 'activities', city: 'Kamakura', area: 'Hase' },
      }),
    )

    expect(action).toEqual({
      kind: 'entity',
      selection: { kind: 'activity', id: 'ACT015' },
    })
  })

  it('keeps local Transport without discovery non-interactive', () => {
    expect(
      getTimelineAction(
        item({
          type: 'transport',
          reference: null,
          isMajorTransport: false,
          discovery: undefined,
        }),
      ),
    ).toBeNull()
  })

  it('resolves the real September 15 Lunch as Food discovery', () => {
    const lunch = getTimelineForDate('2026-09-15').find(
      ({ title }) => title === 'Lunch',
    )
    if (!lunch) throw new Error('Expected real Lunch timeline item')

    expect(getTimelineAction(lunch)).toEqual({
      kind: 'discovery',
      discovery: {
        mode: 'food',
        city: 'Kamakura',
        area: 'Kamakura Station',
        category: 'Meal',
      },
    })
  })
})
