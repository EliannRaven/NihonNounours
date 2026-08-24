import rawTripData from '../data/trip.json'
import type {
  Activity,
  Food,
  Hotel,
  IsoDate,
  Stage,
  TimelineItem,
  Transport,
  TripData,
  TripDay,
  TripMetadata,
} from '../types/trip'

export const tripData = rawTripData as TripData

function getRecordValue<T>(
  record: Readonly<Record<string, T>>,
  key: string,
): T | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined
}

function normalizeCity(city: string): string {
  return city.trim().toLowerCase()
}

function getDateInTimeZone(now: Date, timeZone: string): IsoDate {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const values = new Map(parts.map(({ type, value }) => [type, value]))
  const year = values.get('year')
  const month = values.get('month')
  const day = values.get('day')

  if (!year || !month || !day) {
    throw new Error(`Unable to resolve calendar date in ${timeZone}`)
  }

  return `${year}-${month}-${day}`
}

function getFinalTripDate(): IsoDate {
  const dates = Object.keys(tripData.days)
  return dates.at(-1) ?? tripData.trip.startDate
}

export function getTrip(): TripMetadata {
  return tripData.trip
}

export function getAllStages(): Stage[] {
  return [...tripData.stages]
}

export function getStage(stageOrder: number): Stage | undefined {
  return tripData.stages.find((stage) => stage.stageOrder === stageOrder)
}

export function getStageForDate(date: IsoDate): Stage | undefined {
  return tripData.stages.find(
    (stage) => stage.startDate <= date && date < stage.endDate,
  )
}

export function getDay(date: IsoDate): TripDay | undefined {
  return getRecordValue(tripData.days, date)
}

export function getAllDays(): TripDay[] {
  return Object.values(tripData.days).sort((first, second) =>
    first.date.localeCompare(second.date),
  )
}

export function getDaysForStage(stageOrder: number): TripDay[] {
  return getAllDays().filter((day) => day.stageOrder === stageOrder)
}

export function getHotelForStage(stageOrder: number): Hotel | undefined {
  return getRecordValue(tripData.hotels, String(stageOrder))
}

export function getActivity(id: string): Activity | undefined {
  return getRecordValue(tripData.activities, id)
}

export function getAllActivities(): Activity[] {
  return Object.values(tripData.activities)
}

export function getFood(id: string): Food | undefined {
  return getRecordValue(tripData.food, id)
}

export function getTransport(id: string): Transport | undefined {
  return getRecordValue(tripData.transports, id)
}

export function getTransportsForStage(stageOrder: number): Transport[] {
  return Object.values(tripData.transports)
    .filter((transport) => transport.stageOrder === stageOrder)
    .sort((first, second) => first.date.localeCompare(second.date))
}

export function getActivitiesForCity(city: string): Activity[] {
  const normalizedCity = normalizeCity(city)
  return Object.values(tripData.activities).filter(
    (activity) =>
      activity.city !== null && normalizeCity(activity.city) === normalizedCity,
  )
}

export function getFoodForCity(city: string): Food[] {
  const normalizedCity = normalizeCity(city)
  return Object.values(tripData.food).filter(
    (food) => food.city !== null && normalizeCity(food.city) === normalizedCity,
  )
}

export function getFavoriteActivities(): Activity[] {
  return Object.values(tripData.activities).filter(
    (activity) => activity.favorite,
  )
}

export function getFavoriteFood(): Food[] {
  return Object.values(tripData.food).filter((food) => food.favorite)
}

export function getDefaultTripDate(now: Date = new Date()): IsoDate {
  const currentDate = getDateInTimeZone(now, tripData.trip.timeZone)

  if (currentDate < tripData.trip.startDate) {
    return tripData.trip.startDate
  }
  if (currentDate >= tripData.trip.endDate) {
    return getFinalTripDate()
  }
  return currentDate
}

export function resolveTripDate(
  requestedDate: string | null | undefined,
  now?: Date,
): IsoDate {
  if (requestedDate && getDay(requestedDate)) {
    return requestedDate
  }
  return getDefaultTripDate(now)
}

export function getTimelineForDate(date: IsoDate): TimelineItem[] {
  const day = getDay(date)
  return day ? [...day.timeline] : []
}

export function getMajorTransportsForDate(date: IsoDate): TimelineItem[] {
  return getTimelineForDate(date).filter(
    (item) => item.type === 'transport' && item.isMajorTransport === true,
  )
}
