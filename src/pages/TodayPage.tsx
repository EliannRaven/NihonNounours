import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import {
  EntityBottomSheet,
  type EntitySheetSelection,
} from '../components/sheets/EntityBottomSheet'
import { DayNavigator } from '../components/today/DayNavigator'
import { NextCard } from '../components/today/NextCard'
import { Timeline } from '../components/today/Timeline'
import { TodayHeader } from '../components/today/TodayHeader'
import { getNextTimelineTarget } from '../components/today/nextTimeline'
import {
  getTimelineTemporalState,
  useTripNow,
} from '../components/today/todayTime'
import {
  getAllDays,
  getDay,
  getTimelineForDate,
  getTrip,
  resolveTripDate,
} from '../lib/tripData'
import { buildExploreSearchParams } from '../lib/exploreContext'
import type { DiscoveryMetadata } from '../types/trip'

export function TodayPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [selection, setSelection] = useState<EntitySheetSelection | null>(null)
  const trip = getTrip()
  const tripNow = useTripNow(trip.timeZone)
  const selectedDate = resolveTripDate(searchParams.get('date'))
  const day = getDay(selectedDate)

  if (!day) return null

  const timelineItems = getTimelineForDate(selectedDate)
  const currentTripNow = selectedDate === tripNow.date ? tripNow : null
  const temporalState = currentTripNow
    ? getTimelineTemporalState(
        timelineItems,
        currentTripNow.minutesSinceMidnight,
      )
    : null
  const nextTarget =
    currentTripNow && temporalState
      ? getNextTimelineTarget(
          timelineItems,
          currentTripNow.minutesSinceMidnight,
          temporalState.pastPrefixCount,
        )
      : null

  const selectDate = (date: string) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.set('date', date)
      return nextParams
    })
  }

  const openDiscovery = (discovery: DiscoveryMetadata) => {
    const params = buildExploreSearchParams(discovery)
    navigate({ pathname: '/explore', search: `?${params.toString()}` })
  }

  return (
    <>
      <PageContainer>
        <div className="today-page">
          <TodayHeader day={day} trip={trip} />
          {nextTarget && currentTripNow ? (
            <NextCard
              target={nextTarget}
              currentMinutes={currentTripNow.minutesSinceMidnight}
              onOpenEntity={setSelection}
            />
          ) : null}
          <DayNavigator days={getAllDays()} selectedDate={selectedDate} onSelect={selectDate} />
          <Timeline
            key={selectedDate}
            items={timelineItems}
            onOpenEntity={setSelection}
            onOpenDiscovery={openDiscovery}
            tripNow={currentTripNow}
            temporalState={temporalState}
          />
        </div>
      </PageContainer>
      <EntityBottomSheet selection={selection} onClose={() => setSelection(null)} />
    </>
  )
}
