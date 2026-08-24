import type { IsoDate, TripDay, TripMetadata } from '../../types/trip'
import { formatTripDateRange, getTripProgress } from './tripOverview'

export function TripHeader({
  trip,
  days,
  currentDate,
}: {
  trip: TripMetadata
  days: readonly TripDay[]
  currentDate: IsoDate
}) {
  const progress = getTripProgress(days, trip.totalDays, currentDate)
  const firstDay = days[0]
  const finalDay = days.at(-1)

  return (
    <header className="trip-header">
      <p className="trip-header__eyebrow">Your journey</p>
      <h1>{trip.name}</h1>
      {firstDay && finalDay ? (
        <p className="trip-header__dates">
          {formatTripDateRange(firstDay.date, finalDay.date)}
        </p>
      ) : null}
      <div className="trip-header__progress-copy">
        <span>Day {progress.dayNumber} of {progress.totalDays}</span>
        <span aria-hidden="true">{Math.round(progress.percent)}%</span>
      </div>
      <progress
        className="trip-header__progress"
        value={progress.dayNumber}
        max={progress.totalDays}
        aria-label="Trip progress"
      />
    </header>
  )
}
