import { describe, expect, it } from 'vitest'
import { getTimelineForDate } from '../../lib/tripData'
import type { TimelineItem } from '../../types/trip'
import {
  getTimelineTemporalState,
  getTripNow,
  parseTimeToMinutes,
} from './todayTime'

function timelineItem(overrides: Partial<TimelineItem> = {}): TimelineItem {
  return {
    type: 'activity',
    reference: null,
    title: 'Test item',
    city: null,
    area: null,
    startTime: null,
    endTime: null,
    durationMin: null,
    status: null,
    info: null,
    important: null,
    ...overrides,
  }
}

describe('Japan trip time', () => {
  it('resolves an absolute instant through the requested trip timezone', () => {
    const instant = new Date('2026-09-14T15:30:00Z')

    expect(getTripNow(instant, 'Asia/Tokyo')).toEqual({
      date: '2026-09-15',
      time: '00:30',
      minutesSinceMidnight: 30,
    })
    expect(getTripNow(instant, 'Europe/Zurich').date).toBe('2026-09-14')
  })

  it('parses valid 24-hour times into minutes', () => {
    expect(parseTimeToMinutes('07:00')).toBe(420)
    expect(parseTimeToMinutes('12:30')).toBe(750)
    expect(parseTimeToMinutes('16:00')).toBe(960)
  })

  it('fails safely for missing or invalid times', () => {
    expect(parseTimeToMinutes(null)).toBeNull()
    expect(parseTimeToMinutes(undefined)).toBeNull()
    expect(parseTimeToMinutes('24:00')).toBeNull()
    expect(parseTimeToMinutes('7:00')).toBeNull()
  })
})

describe('timeline temporal classification', () => {
  it('classifies an explicitly ended item as past', () => {
    const state = getTimelineTemporalState(
      [timelineItem({ startTime: '07:00', endTime: '08:30' })],
      540,
    )
    expect(state.pastPrefixCount).toBe(1)
  })

  it('does not classify an explicitly ongoing item as past', () => {
    const state = getTimelineTemporalState(
      [timelineItem({ startTime: '08:00', endTime: '10:00' })],
      540,
    )
    expect(state.pastPrefixCount).toBe(0)
  })

  it('uses start plus duration only for temporal classification', () => {
    const item = timelineItem({ startTime: '08:00', durationMin: 60 })

    expect(getTimelineTemporalState([item], 540).pastPrefixCount).toBe(1)
    expect(getTimelineTemporalState([item], 539).pastPrefixCount).toBe(0)
  })

  it('classifies a start-only predecessor after a later item starts', () => {
    const items = [
      timelineItem({ startTime: '08:00' }),
      timelineItem({ startTime: '09:00' }),
    ]
    expect(getTimelineTemporalState(items, 540).pastPrefixCount).toBe(1)
  })

  it('classifies an untimed predecessor after a later item starts', () => {
    const items = [
      timelineItem(),
      timelineItem({ startTime: '09:00' }),
    ]
    expect(getTimelineTemporalState(items, 540).pastPrefixCount).toBe(1)
  })

  it('stops the collapsible prefix at an unknown item', () => {
    const items = [
      timelineItem({ endTime: '08:00' }),
      timelineItem(),
      timelineItem({ endTime: '09:00' }),
    ]
    expect(getTimelineTemporalState(items, 600).pastPrefixCount).toBe(1)
  })

  it('treats equality at an explicit end boundary as past', () => {
    const item = timelineItem({ endTime: '08:30' })
    expect(getTimelineTemporalState([item], 510).pastPrefixCount).toBe(1)
  })

  it('places NOW after all items when the full timeline is past', () => {
    const items = [
      timelineItem({ endTime: '08:00' }),
      timelineItem({ endTime: '09:00' }),
    ]
    expect(getTimelineTemporalState(items, 600)).toEqual({
      pastPrefixCount: 2,
      nowInsertIndex: 0,
    })
  })

  it('models the real September 15 prefix at 13:30 JST', () => {
    const state = getTimelineTemporalState(
      getTimelineForDate('2026-09-15'),
      13 * 60 + 30,
    )

    expect(state).toEqual({
      pastPrefixCount: 2,
      nowInsertIndex: 1,
    })
  })
})
