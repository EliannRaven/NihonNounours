import type { EntitySheetSelection } from '../sheets/EntityBottomSheet'
import type { TimelineItem } from '../../types/trip'

const weekdays = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

function parseTripDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) throw new Error(`Invalid normalized trip date: ${date}`)
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

export function getDateParts(date: string) {
  const { year, month, day } = parseTripDate(date)
  const weekday = weekdays[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  const monthName = months[month - 1]
  if (!weekday || !monthName) throw new Error(`Invalid normalized trip date: ${date}`)
  return { day, monthShort: monthName.slice(0, 3), weekday, weekdayShort: weekday.slice(0, 3) }
}

export function formatLongDate(date: string): string {
  const { year, month, day } = parseTripDate(date)
  const weekday = weekdays[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  const monthName = months[month - 1]
  return weekday && monthName ? `${weekday}, ${day} ${monthName}` : date
}

export function formatTimelineTime(item: TimelineItem): string | null {
  if (item.startTime && item.endTime) return `${item.startTime} – ${item.endTime}`
  if (item.startTime) return item.startTime
  if (item.durationMin !== null) return `${item.durationMin} min`
  return null
}

export function getEntitySelection(item: TimelineItem): EntitySheetSelection | null {
  const type = item.type.trim().toLowerCase()
  if (type === 'activity' && item.reference?.startsWith('ACT')) return { kind: 'activity', id: item.reference }
  if (type === 'food' && item.reference?.startsWith('FOD')) return { kind: 'food', id: item.reference }
  if (type === 'transport' && item.reference?.startsWith('TRA')) return { kind: 'transport', id: item.reference }
  if (type === 'hotel' && item.hotelStageOrder !== undefined) return { kind: 'hotel', stageOrder: item.hotelStageOrder }
  return null
}

export function getTimelinePresentation(item: TimelineItem, hasEntity: boolean) {
  if (!hasEntity && item.status?.trim().toLowerCase() === 'flexible') {
    return { className: 'flexible', label: 'Flexible', symbol: '✨' }
  }
  const presentations: Record<string, { className: string; label: string; symbol: string }> = {
    activity: { className: 'activity', label: 'Activity', symbol: '🌿' },
    food: { className: 'food', label: 'Food', symbol: '🍜' },
    transport: { className: 'transport', label: 'Transport', symbol: '🚇' },
    hotel: { className: 'hotel', label: 'Hotel', symbol: '🏨' },
  }
  return presentations[item.type.trim().toLowerCase()] ?? {
    className: 'flexible', label: 'Flexible', symbol: '✨',
  }
}
