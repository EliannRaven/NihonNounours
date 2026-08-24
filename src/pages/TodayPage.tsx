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
          <TodayHeader day={day} trip={getTrip()} />
          <DayNavigator days={getAllDays()} selectedDate={selectedDate} onSelect={selectDate} />
          <Timeline items={getTimelineForDate(selectedDate)} onOpenEntity={setSelection} />
        </div>
      </PageContainer>
      <EntityBottomSheet selection={selection} onClose={() => setSelection(null)} />
    </>
  )
}
