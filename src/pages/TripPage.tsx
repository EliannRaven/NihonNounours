import { useEffect, useRef, useState } from 'react'
import { PageContainer } from '../components/PageContainer'
import {
  EntityBottomSheet,
  type EntitySheetSelection,
} from '../components/sheets/EntityBottomSheet'
import { useTripNow } from '../components/today/todayTime'
import { StageList } from '../components/trip/StageList'
import { TripHeader } from '../components/trip/TripHeader'
import { getDefaultExpandedStageOrder } from '../components/trip/tripOverview'
import { getAllDays, getAllStages, getTrip } from '../lib/tripData'

export function TripPage() {
  const trip = getTrip()
  const stages = getAllStages()
  const days = getAllDays()
  const tripNow = useTripNow(trip.timeZone)
  const defaultStageOrder = getDefaultExpandedStageOrder(stages, tripNow.date)
  const [expandedStageOrder, setExpandedStageOrder] = useState(defaultStageOrder)
  const [selection, setSelection] = useState<EntitySheetSelection | null>(null)
  const hasManuallySelectedStage = useRef(false)

  useEffect(() => {
    if (!hasManuallySelectedStage.current) {
      setExpandedStageOrder(defaultStageOrder)
    }
  }, [defaultStageOrder])

  const expandStage = (stageOrder: number) => {
    hasManuallySelectedStage.current = true
    setExpandedStageOrder(stageOrder)
  }

  return (
    <>
      <PageContainer>
        <div className="trip-page">
          <TripHeader trip={trip} days={days} currentDate={tripNow.date} />
          <StageList
            stages={stages}
            currentDate={tripNow.date}
            expandedStageOrder={expandedStageOrder}
            onExpandStage={expandStage}
            onOpenHotel={(stageOrder) =>
              setSelection({ kind: 'hotel', stageOrder })
            }
            onOpenTransport={(id) => setSelection({ kind: 'transport', id })}
          />
        </div>
      </PageContainer>
      <EntityBottomSheet selection={selection} onClose={() => setSelection(null)} />
    </>
  )
}
