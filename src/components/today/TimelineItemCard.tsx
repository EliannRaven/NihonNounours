import type { EntitySheetSelection } from '../sheets/EntityBottomSheet'
import type { TimelineItem } from '../../types/trip'
import { formatTimelineTime, getTimelinePresentation } from './todayUtils'

interface TimelineItemCardProps {
  item: TimelineItem
  selection: EntitySheetSelection | null
  onOpen: (selection: EntitySheetSelection) => void
  isEarlier?: boolean
}

function TimelineCardContent({ item, hasEntity }: { item: TimelineItem; hasEntity: boolean }) {
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
      </span>
      {time ? <span className="timeline-item__time">{time}</span> : null}
    </>
  )
}

export function TimelineItemCard({
  item,
  selection,
  onOpen,
  isEarlier = false,
}: TimelineItemCardProps) {
  const content = <TimelineCardContent item={item} hasEntity={selection !== null} />
  return (
    <li className={`timeline-item${isEarlier ? ' is-earlier' : ''}`}>
      <span className="timeline-item__marker" aria-hidden="true" />
      {selection ? (
        <button className="timeline-item__card is-interactive" type="button" onClick={() => onOpen(selection)}>
          {content}
        </button>
      ) : (
        <article className="timeline-item__card">{content}</article>
      )}
    </li>
  )
}
