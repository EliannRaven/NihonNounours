import type { EntitySheetSelection } from '../sheets/EntityBottomSheet'
import type { DiscoveryMetadata, TimelineItem } from '../../types/trip'
import { TimelineItemCard } from './TimelineItemCard'
import { getTimelineAction } from './timelineAction'

interface EarlierTodayProps {
  items: readonly TimelineItem[]
  isExpanded: boolean
  onToggle: () => void
  onOpenEntity: (selection: EntitySheetSelection) => void
  onOpenDiscovery: (discovery: DiscoveryMetadata) => void
}

export function EarlierToday({
  items,
  isExpanded,
  onToggle,
  onOpenEntity,
  onOpenDiscovery,
}: EarlierTodayProps) {
  return (
    <li className="earlier-today">
      <button
        className="earlier-today__toggle"
        type="button"
        aria-label={`Earlier today · ${items.length} ${items.length === 1 ? 'item' : 'items'}`}
        aria-expanded={isExpanded}
        onClick={onToggle}
      >
        <span>Earlier today</span>
        <span>· {items.length} {items.length === 1 ? 'item' : 'items'}</span>
      </button>
      {isExpanded ? (
        <ol className="earlier-today__items">
          {items.map((item, index) => (
            <TimelineItemCard
              key={`${item.reference || item.title || item.type}-${index}`}
              item={item}
              action={getTimelineAction(item)}
              onOpenEntity={onOpenEntity}
              onOpenDiscovery={onOpenDiscovery}
              isEarlier
            />
          ))}
        </ol>
      ) : null}
    </li>
  )
}
