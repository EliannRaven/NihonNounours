import { useEffect, useRef } from 'react'
import type { TripDay } from '../../types/trip'
import { formatLongDate, getDateParts } from './todayUtils'
import { getScrollBehavior } from './todayTime'

interface DayNavigatorProps {
  days: readonly TripDay[]
  selectedDate: string
  onSelect: (date: string) => void
}

export function DayNavigator({ days, selectedDate, onSelect }: DayNavigatorProps) {
  const selectedButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    selectedButtonRef.current?.scrollIntoView?.({
      behavior: getScrollBehavior(), block: 'nearest', inline: 'center',
    })
  }, [selectedDate])

  return (
    <nav className="day-navigator" aria-label="Trip dates">
      <div className="day-navigator__scroller">
        {days.map((day) => {
          const parts = getDateParts(day.date)
          const isSelected = day.date === selectedDate
          return (
            <button
              key={day.date}
              ref={isSelected ? selectedButtonRef : undefined}
              className="day-navigator__day"
              type="button"
              aria-label={`${formatLongDate(day.date)}, Day ${day.dayNumber}`}
              aria-current={isSelected ? 'date' : undefined}
              onClick={() => onSelect(day.date)}
            >
              <span>{parts.weekdayShort}</span>
              <strong>{parts.day}</strong>
              <small>{parts.monthShort}</small>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
