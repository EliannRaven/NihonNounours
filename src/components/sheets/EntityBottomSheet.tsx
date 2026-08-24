import {
  getActivity,
  getFood,
  getHotelForStage,
  getTransport,
} from '../../lib/tripData'
import { ActivityDetails } from './ActivityDetails'
import { BottomSheet } from './BottomSheet'
import { FoodDetails } from './FoodDetails'
import { HotelDetails } from './HotelDetails'
import { TransportDetails } from './TransportDetails'

export type EntitySheetSelection =
  | { kind: 'activity'; id: string }
  | { kind: 'food'; id: string }
  | { kind: 'transport'; id: string }
  | { kind: 'hotel'; stageOrder: number }

interface EntityBottomSheetProps {
  selection: EntitySheetSelection | null
  onClose: () => void
}

const titleId = 'entity-bottom-sheet-title'

function renderSelection(selection: EntitySheetSelection | null) {
  if (!selection) {
    return null
  }

  switch (selection.kind) {
    case 'activity': {
      const activity = getActivity(selection.id)
      return activity ? (
        <ActivityDetails activity={activity} titleId={titleId} />
      ) : null
    }
    case 'food': {
      const food = getFood(selection.id)
      return food ? <FoodDetails food={food} titleId={titleId} /> : null
    }
    case 'transport': {
      const transport = getTransport(selection.id)
      return transport ? (
        <TransportDetails transport={transport} titleId={titleId} />
      ) : null
    }
    case 'hotel': {
      const hotel = getHotelForStage(selection.stageOrder)
      return hotel ? <HotelDetails hotel={hotel} titleId={titleId} /> : null
    }
  }
}

export function EntityBottomSheet({
  selection,
  onClose,
}: EntityBottomSheetProps) {
  const details = renderSelection(selection)

  return (
    <BottomSheet isOpen={details !== null} titleId={titleId} onClose={onClose}>
      {details}
    </BottomSheet>
  )
}
