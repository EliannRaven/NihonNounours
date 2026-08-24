import type { EntitySheetSelection } from '../sheets/EntityBottomSheet'
import type { DiscoveryMetadata, TimelineItem } from '../../types/trip'
import { getEntitySelection } from './todayUtils'

export type TimelineAction =
  | { kind: 'entity'; selection: EntitySheetSelection }
  | { kind: 'discovery'; discovery: DiscoveryMetadata }
  | null

export function getTimelineAction(item: TimelineItem): TimelineAction {
  const selection = getEntitySelection(item)
  const isIneligibleLocalTransport =
    selection?.kind === 'transport' && item.isMajorTransport !== true

  if (selection && !isIneligibleLocalTransport) {
    return { kind: 'entity', selection }
  }
  if (item.discovery) {
    return { kind: 'discovery', discovery: item.discovery }
  }
  return null
}
