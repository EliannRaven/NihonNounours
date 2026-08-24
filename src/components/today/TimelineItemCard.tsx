import type { EntitySheetSelection } from '../sheets/EntityBottomSheet'
import type { DiscoveryMetadata, TimelineItem } from '../../types/trip'
import { formatTimelineTime, getTimelinePresentation } from './todayUtils'
import type { TimelineAction } from './timelineAction'

interface TimelineItemCardProps {
  item: TimelineItem
  action: TimelineAction
  onOpenEntity: (selection: EntitySheetSelection) => void
  onOpenDiscovery: (discovery: DiscoveryMetadata) => void
  isEarlier?: boolean
}

function TimelineCardContent({
  item,
  hasEntity,
  hasDiscovery,
}: {
  item: TimelineItem
  hasEntity: boolean
  hasDiscovery: boolean
}) {
  const presentation = getTimelinePresentation(item, hasEntity)
  const time = formatTimelineTime(item)
  const showDuration = item.durationMin !== null && Boolean(item.startTime || item.endTime)
  const showStatus =
    item.status &&
    item.status.trim().toLowerCase() !== presentation.label.toLowerCase()

  return (
    <>
      <span className={`timeline-item__accent is-${presentation.className}`} />
      <span className="timeline-item__body">
        <span className="timeline-item__type">
          <span aria-hidden="true">{presentation.symbol}</span> {presentation.label}
        </span>
        <span className="timeline-item__title">
          {item.title || presentation.label}
          {item.favorite ? <span className="timeline-item__favorite" aria-label="Favorite">🐻</span> : null}
        </span>
        <span className="timeline-item__metadata">
          {item.area ? <span>{item.area}</span> : null}
          {showDuration ? <span>{item.durationMin} min</span> : null}
          {showStatus ? <span className="pill">{item.status}</span> : null}
        </span>
        {hasDiscovery ? (
          <span className="timeline-item__affordance" aria-hidden="true">
            Explore options →
          </span>
        ) : null}
      </span>
      {time ? <span className="timeline-item__time">{time}</span> : null}
    </>
  )
}

export function TimelineItemCard({
  item,
  action,
  onOpenEntity,
  onOpenDiscovery,
  isEarlier = false,
}: TimelineItemCardProps) {
  const content = (
    <TimelineCardContent
      item={item}
      hasEntity={action?.kind === 'entity'}
      hasDiscovery={action?.kind === 'discovery'}
    />
  )
  const handleAction = () => {
    if (action?.kind === 'entity') onOpenEntity(action.selection)
    if (action?.kind === 'discovery') onOpenDiscovery(action.discovery)
  }
  const discoveryLabel =
    action?.kind === 'discovery'
      ? `${item.title || 'Flexible option'}, explore ${action.discovery.mode} options`
      : undefined
  return (
    <li className={`timeline-item${isEarlier ? ' is-earlier' : ''}`}>
      <span className="timeline-item__marker" aria-hidden="true" />
      {action ? (
        <button
          className="timeline-item__card is-interactive"
          type="button"
          aria-label={discoveryLabel}
          onClick={handleAction}
        >
          {content}
        </button>
      ) : (
        <article className="timeline-item__card">{content}</article>
      )}
    </li>
  )
}
