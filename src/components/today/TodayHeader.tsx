import type { TripDay, TripMetadata } from '../../types/trip'
import { formatLongDate } from './todayUtils'

export function TodayHeader({ day, trip }: { day: TripDay; trip: TripMetadata }) {
  return (
    <header className="today-header">
      <div>
        <h1>{day.city || 'Japan'}</h1>
        {day.japaneseName ? <p className="today-header__japanese">{day.japaneseName}</p> : null}
      </div>
      <div className="today-header__metadata">
        <p>{formatLongDate(day.date)}</p>
        <span className="pill">Day {day.dayNumber} of {trip.totalDays}</span>
      </div>
    </header>
  )
}
