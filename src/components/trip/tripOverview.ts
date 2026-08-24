import type { IsoDate, Stage, TripDay } from '../../types/trip'

export type StageTemporalState = 'past' | 'current' | 'future'

export interface TripProgress {
  dayNumber: number
  totalDays: number
  percent: number
}

const shortMonths = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const
const shortWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function parseIsoDate(date: IsoDate): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return null
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

export function formatTripDayDate(date: IsoDate): string {
  const parsed = parseIsoDate(date)
  if (!parsed) return date
  return `${shortWeekdays[parsed.getUTCDay()]} ${parsed.getUTCDate()} ${shortMonths[parsed.getUTCMonth()]}`
}

export function formatTripDateRange(
  startDate: IsoDate,
  endDate: IsoDate,
): string {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  if (!start || !end) return `${startDate} – ${endDate}`

  const startDay = start.getUTCDate()
  const endDay = end.getUTCDate()
  const startMonth = shortMonths[start.getUTCMonth()]
  const endMonth = shortMonths[end.getUTCMonth()]
  return startMonth === endMonth
    ? `${startDay}–${endDay} ${endMonth}`
    : `${startDay} ${startMonth} – ${endDay} ${endMonth}`
}

export function getStageTemporalState(
  stage: Stage,
  currentDate: IsoDate,
): StageTemporalState {
  if (currentDate < stage.startDate) return 'future'
  if (currentDate >= stage.endDate) return 'past'
  return 'current'
}

export function getDefaultExpandedStageOrder(
  stages: readonly Stage[],
  currentDate: IsoDate,
): number | null {
  const firstStage = stages[0]
  const finalStage = stages.at(-1)
  if (!firstStage || !finalStage) return null

  const currentStage = stages.find(
    (stage) => stage.startDate <= currentDate && currentDate < stage.endDate,
  )
  if (currentStage) return currentStage.stageOrder
  return currentDate < firstStage.startDate
    ? firstStage.stageOrder
    : finalStage.stageOrder
}

export function getTripProgress(
  days: readonly TripDay[],
  totalDays: number,
  currentDate: IsoDate,
): TripProgress {
  const firstDay = days[0]
  const finalDay = days.at(-1)
  let dayNumber = 0

  if (firstDay && finalDay) {
    if (currentDate > finalDay.date) {
      dayNumber = totalDays
    } else if (currentDate >= firstDay.date) {
      dayNumber =
        days.find((day) => day.date === currentDate)?.dayNumber ??
        days.filter((day) => day.date <= currentDate).at(-1)?.dayNumber ??
        0
    }
  }

  const boundedDayNumber = Math.min(Math.max(dayNumber, 0), totalDays)
  return {
    dayNumber: boundedDayNumber,
    totalDays,
    percent: totalDays > 0 ? (boundedDayNumber / totalDays) * 100 : 0,
  }
}
