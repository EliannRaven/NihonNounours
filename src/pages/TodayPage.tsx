import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import {
  EntityBottomSheet,
  type EntitySheetSelection,
} from '../components/sheets/EntityBottomSheet'
import { DayNavigator } from '../components/today/DayNavigator'
import { Timeline } from '../components/today/Timeline'
import { TodayHeader } from '../components/today/TodayHeader'
import { useTripNow } from '../components/today/todayTime'
import {
  getAllDays,
  getDay,
  getTimelineForDate,
  getTrip,
  resolveTripDate,
} from '../lib/tripData'

export function TodayPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selection, setSelection] = useState<EntitySheetSelection | null>(null)
  const trip = getTrip()
  const tripNow = useTripNow(trip.timeZone)
  const selectedDate = resolveTripDate(searchParams.get('date'))
  const day = getDay(selectedDate)

  if (!day) return null

  const selectDate = (date: string) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.set('date', date)
      return nextParams
    })
  }

  return (
    <>
      <PageContainer>
        <div className="today-page">
          <TodayHeader day={day} trip={trip} />
          <DayNavigator days={getAllDays()} selectedDate={selectedDate} onSelect={selectDate} />
          <Timeline
            key={selectedDate}
            items={getTimelineForDate(selectedDate)}
            onOpenEntity={setSelection}
            tripNow={selectedDate === tripNow.date ? tripNow : null}
          />
        </div>
      </PageContainer>
      <EntityBottomSheet selection={selection} onClose={() => setSelection(null)} />
    </>
  )
}
