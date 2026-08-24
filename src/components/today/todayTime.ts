import { useEffect, useState } from 'react'
import type { TimelineItem } from '../../types/trip'

export interface TripNow {
  date: string
  time: string
  minutesSinceMidnight: number
}

export interface TimelineTemporalState {
  pastPrefixCount: number
  nowInsertIndex: number
}

export function parseTimeToMinutes(time: string | null | undefined) {
  if (!time) return null
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function getTripNow(now: Date, timeZone: string): TripNow {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const values = new Map(parts.map(({ type, value }) => [type, value]))
  const year = values.get('year')
  const month = values.get('month')
  const day = values.get('day')
  const hour = values.get('hour')
  const minute = values.get('minute')

  if (!year || !month || !day || !hour || !minute) {
    throw new Error(`Unable to resolve current time in ${timeZone}`)
  }

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
    minutesSinceMidnight: Number(hour) * 60 + Number(minute),
  }
}

function hasStartedLaterItem(
  items: readonly TimelineItem[],
  index: number,
  currentMinutes: number,
) {
  return items.slice(index + 1).some((item) => {
    const startMinutes = parseTimeToMinutes(item.startTime)
    return startMinutes !== null && startMinutes <= currentMinutes
  })
}

function isConfidentlyPast(
  items: readonly TimelineItem[],
  index: number,
  currentMinutes: number,
) {
  const item = items[index]
  if (!item) return false

  const startMinutes = parseTimeToMinutes(item.startTime)
  const endMinutes = parseTimeToMinutes(item.endTime)

  if (endMinutes !== null) return endMinutes <= currentMinutes

  if (startMinutes !== null && item.durationMin !== null) {
    const estimatedEnd = Math.min(startMinutes + item.durationMin, 24 * 60)
    return estimatedEnd <= currentMinutes
  }

  return hasStartedLaterItem(items, index, currentMinutes)
}

export function getTimelineTemporalState(
  items: readonly TimelineItem[],
  currentMinutes: number,
): TimelineTemporalState {
  let pastPrefixCount = 0
  while (
    pastPrefixCount < items.length &&
    isConfidentlyPast(items, pastPrefixCount, currentMinutes)
  ) {
    pastPrefixCount += 1
  }

  const remainingItems = items.slice(pastPrefixCount)
  const nextFutureIndex = remainingItems.findIndex((item) => {
    const startMinutes = parseTimeToMinutes(item.startTime)
    return startMinutes !== null && startMinutes > currentMinutes
  })

  return {
    pastPrefixCount,
    nowInsertIndex:
      nextFutureIndex === -1 ? remainingItems.length : nextFutureIndex,
  }
}

export function getScrollBehavior(): ScrollBehavior {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return 'auto'
  }
  return 'smooth'
}

export function useTripNow(timeZone: string): TripNow {
  const [tripNow, setTripNow] = useState(() => getTripNow(new Date(), timeZone))

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTripNow(getTripNow(new Date(), timeZone))
    }, 60_000)
    return () => window.clearInterval(intervalId)
  }, [timeZone])

  return tripNow
}
