import { describe, expect, it } from 'vitest'
import { getTimelineForDate } from '../../lib/tripData'
import type { TimelineItem } from '../../types/trip'
import {
  formatMinutesAsTime,
  getLeaveGuidance,
  getNextTimelineTarget,
} from './nextTimeline'
import { getTimelineTemporalState } from './todayTime'

function item(overrides: Partial<TimelineItem> = {}): TimelineItem {
  return {
    type: 'activity',
    reference: 'ACT001',
    title: 'Activity',
    city: null,
    area: null,
    startTime: '10:00',
    endTime: null,
    durationMin: 60,
    status: null,
    info: null,
    important: null,
    ...overrides,
  }
}

function targetFor(items: readonly TimelineItem[], currentMinutes = 9 * 60) {
  return getNextTimelineTarget(items, currentMinutes, 0)
}

describe('NEXT candidate selection', () => {
  it('selects a future entity-backed Activity', () => {
    expect(targetFor([item()])?.selection).toEqual({
      kind: 'activity',
      id: 'ACT001',
    })
  })

  it('selects a future entity-backed Food item', () => {
    expect(
      targetFor([item({ type: 'food', reference: 'FOD003' })])?.selection,
    ).toEqual({ kind: 'food', id: 'FOD003' })
  })

  it('selects a Hotel item', () => {
    expect(
      targetFor([
        item({
          type: 'hotel',
          reference: null,
          hotelStageOrder: 4,
        }),
      ])?.selection,
    ).toEqual({ kind: 'hotel', stageOrder: 4 })
  })

  it('selects an entity-backed major Transport', () => {
    expect(
      targetFor([
        item({
          type: 'transport',
          reference: 'TRA004',
          isMajorTransport: true,
        }),
      ])?.selection,
    ).toEqual({ kind: 'transport', id: 'TRA004' })
  })

  it('never selects local Transport as a standalone NEXT target', () => {
    expect(
      targetFor([
        item({
          type: 'transport',
          reference: null,
          isMajorTransport: false,
        }),
      ]),
    ).toBeNull()
  })

  it('never selects a flexible non-entity item', () => {
    expect(
      targetFor([
        item({ type: 'food', reference: null, status: 'Flexible' }),
      ]),
    ).toBeNull()
  })

  it('skips an already-started Activity', () => {
    const target = targetFor([
      item({ title: 'Started', startTime: '08:30' }),
      item({ reference: 'ACT002', title: 'Future', startTime: '11:00' }),
    ])
    expect(target?.item.title).toBe('Future')
  })

  it('allows an untimed major Transport to become NEXT', () => {
    const target = targetFor([
      item({
        type: 'transport',
        reference: 'TRA004',
        isMajorTransport: true,
        startTime: null,
      }),
    ])
    expect(target?.selection.kind).toBe('transport')
  })

  it('preserves authored order instead of sorting by start time', () => {
    const target = targetFor([
      item({ reference: 'ACT001', title: 'First authored', startTime: '12:00' }),
      item({ reference: 'ACT002', title: 'Earlier clock', startTime: '10:00' }),
    ])
    expect(target?.item.title).toBe('First authored')
  })

  it('returns null when no eligible meaningful candidate remains', () => {
    expect(targetFor([item({ startTime: '08:00' })])).toBeNull()
  })
})

describe('local Transport context and leave guidance', () => {
  const localTransport = (durationMin: number | null, title = 'Local train') =>
    item({
      type: 'transport',
      reference: null,
      title,
      startTime: null,
      durationMin,
      isMajorTransport: false,
    })

  it('attaches immediately adjacent local Transport to the Activity', () => {
    const transport = localTransport(45)
    const target = targetFor([transport, item()])
    expect(target?.contextualTransports).toEqual([transport])
    expect(target?.leaveMinutes).toBe(9 * 60 + 15)
  })

  it('does not carry local Transport across a flexible item', () => {
    const target = targetFor([
      localTransport(45),
      item({ type: 'food', reference: null, status: 'Flexible' }),
      item(),
    ])
    expect(target?.contextualTransports).toEqual([])
  })

  it('supports multiple contiguous local Transport rows', () => {
    const first = localTransport(15, 'Walk')
    const second = localTransport(30, 'Train')
    const target = targetFor([first, second, item()])
    expect(target?.contextualTransports).toEqual([first, second])
    expect(target?.leaveMinutes).toBe(9 * 60 + 15)
  })

  it('hides leave calculation when any contextual duration is missing', () => {
    expect(targetFor([localTransport(null), item()])?.leaveMinutes).toBeNull()
  })

  it('hides a negative leave calculation', () => {
    const target = targetFor(
      [localTransport(60), item({ startTime: '00:30' })],
      0,
    )
    expect(target?.leaveMinutes).toBeNull()
  })

  it('formats valid minute values without Date objects', () => {
    expect(formatMinutesAsTime(9 * 60 + 15)).toBe('09:15')
    expect(formatMinutesAsTime(-1)).toBeNull()
  })

  it('switches from Leave around to Leave now at the threshold', () => {
    const target = targetFor([localTransport(45), item()])
    if (!target) throw new Error('Expected a NEXT target')

    expect(getLeaveGuidance(target, 9 * 60 + 14)?.label).toBe(
      'Leave around 09:15',
    )
    expect(getLeaveGuidance(target, 9 * 60 + 15)?.label).toBe('Leave now')
    expect(getLeaveGuidance(target, 9 * 60 + 40)?.label).toBe('Leave now')
  })

  it('drops the candidate when its start time is reached', () => {
    expect(targetFor([localTransport(45), item()], 10 * 60)).toBeNull()
  })
})

describe('real September 15 NEXT model', () => {
  it('selects Kōtoku-in rather than the already-started Hasedera at 13:30', () => {
    const timeline = getTimelineForDate('2026-09-15')
    const temporalState = getTimelineTemporalState(timeline, 13 * 60 + 30)
    const target = getNextTimelineTarget(
      timeline,
      13 * 60 + 30,
      temporalState.pastPrefixCount,
    )

    expect(target?.item.title).toBe('Kōtoku-in – Great Buddha')
  })
})
