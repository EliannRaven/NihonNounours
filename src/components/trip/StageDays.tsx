import { Link } from 'react-router-dom'
import type { TripDay } from '../../types/trip'
import { formatTripDayDate } from './tripOverview'

export function StageDays({ days }: { days: readonly TripDay[] }) {
  return (
    <section className="stage-days" aria-label="Stage days">
      <h3>Days</h3>
      <ol className="stage-days__list">
        {days.map((day) => {
          const formattedDate = formatTripDayDate(day.date)
          const planLabel = `${day.timeline.length} ${day.timeline.length === 1 ? 'plan' : 'plans'}`
          return (
            <li key={day.date}>
              <Link
                className="stage-day"
                to={`/today?date=${day.date}`}
                aria-label={`Day ${day.dayNumber}, ${formattedDate}`}
              >
                <strong>Day {day.dayNumber}</strong>
                <span>{formattedDate}</span>
                <span className="stage-day__plans">{planLabel}</span>
                <span className="stage-day__arrow" aria-hidden="true">→</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
