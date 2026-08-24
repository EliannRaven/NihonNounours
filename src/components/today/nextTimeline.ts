import type { EntitySheetSelection } from '../sheets/EntityBottomSheet'
import type { TimelineItem } from '../../types/trip'
import { getEntitySelection } from './todayUtils'
import { parseTimeToMinutes } from './todayTime'

export interface NextTimelineTarget {
  item: TimelineItem
  itemIndex: number
  selection: EntitySheetSelection
  contextualTransports: readonly TimelineItem[]
  leaveMinutes: number | null
}

export interface LeaveGuidance {
  kind: 'around' | 'now'
  label: string
}

function isLocalTransport(item: TimelineItem) {
  return (
    item.type.trim().toLowerCase() === 'transport' &&
    item.isMajorTransport !== true
  )
}

function isEligibleCandidate(
  item: TimelineItem,
  selection: EntitySheetSelection | null,
) {
  if (!selection) return false
  if (selection.kind === 'transport') return item.isMajorTransport === true
  return (
    selection.kind === 'activity' ||
    selection.kind === 'food' ||
    selection.kind === 'hotel'
  )
}

function getContextualTransports(
  items: readonly TimelineItem[],
  itemIndex: number,
  pastPrefixCount: number,
) {
  const transports: TimelineItem[] = []
  for (let index = itemIndex - 1; index >= pastPrefixCount; index -= 1) {
    const item = items[index]
    if (!item || !isLocalTransport(item)) break
    transports.unshift(item)
  }
  return transports
}

function getLeaveMinutes(
  item: TimelineItem,
  contextualTransports: readonly TimelineItem[],
) {
  const startMinutes = parseTimeToMinutes(item.startTime)
  if (startMinutes === null || contextualTransports.length === 0) return null

  if (
    contextualTransports.some(
      ({ durationMin }) => durationMin === null || durationMin <= 0,
    )
  ) {
    return null
  }

  const travelDuration = contextualTransports.reduce(
    (total, { durationMin }) => total + (durationMin ?? 0),
    0,
  )
  const leaveMinutes = startMinutes - travelDuration
  return leaveMinutes >= 0 ? leaveMinutes : null
}

export function getNextTimelineTarget(
  items: readonly TimelineItem[],
  currentMinutes: number,
  pastPrefixCount: number,
): NextTimelineTarget | null {
  for (let itemIndex = pastPrefixCount; itemIndex < items.length; itemIndex += 1) {
    const item = items[itemIndex]
    if (!item) continue

    const selection = getEntitySelection(item)
    if (!isEligibleCandidate(item, selection) || !selection) continue

    const startMinutes = parseTimeToMinutes(item.startTime)
    if (item.startTime !== null && startMinutes === null) continue
    if (startMinutes !== null && startMinutes <= currentMinutes) continue

    const contextualTransports = getContextualTransports(
      items,
      itemIndex,
      pastPrefixCount,
    )
    return {
      item,
      itemIndex,
      selection,
      contextualTransports,
      leaveMinutes: getLeaveMinutes(item, contextualTransports),
    }
  }
  return null
}

export function formatMinutesAsTime(minutes: number): string | null {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes >= 24 * 60) {
    return null
  }
  const hour = Math.floor(minutes / 60).toString().padStart(2, '0')
  const minute = (minutes % 60).toString().padStart(2, '0')
  return `${hour}:${minute}`
}

export function getLeaveGuidance(
  target: NextTimelineTarget,
  currentMinutes: number,
): LeaveGuidance | null {
  if (target.leaveMinutes === null) return null
  const startMinutes = parseTimeToMinutes(target.item.startTime)
  if (startMinutes === null || currentMinutes >= startMinutes) return null
  if (currentMinutes >= target.leaveMinutes) {
    return { kind: 'now', label: 'Leave now' }
  }
  const leaveTime = formatMinutesAsTime(target.leaveMinutes)
  return leaveTime
    ? { kind: 'around', label: `Leave around ${leaveTime}` }
    : null
}
