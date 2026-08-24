import { useEffect, useRef, useState } from 'react'
import type { EntitySheetSelection } from '../sheets/EntityBottomSheet'
import type { TimelineItem as TimelineItemType } from '../../types/trip'
import { EarlierToday } from './EarlierToday'
import { TimelineItemCard } from './TimelineItemCard'
import { getEntitySelection } from './todayUtils'
import {
  getScrollBehavior,
  getTimelineTemporalState,
  type TripNow,
} from './todayTime'

export function Timeline({
  items,
  onOpenEntity,
  tripNow,
}: {
  items: readonly TimelineItemType[]
  onOpenEntity: (selection: EntitySheetSelection) => void
  tripNow: TripNow | null
}) {
  const [isEarlierExpanded, setIsEarlierExpanded] = useState(false)
  const nowMarkerRef = useRef<HTMLLIElement>(null)
  const shouldAutoScroll = tripNow !== null

  useEffect(() => {
    if (!shouldAutoScroll) return
    nowMarkerRef.current?.scrollIntoView?.({
      behavior: getScrollBehavior(),
      block: 'center',
    })
  }, [shouldAutoScroll])

  if (items.length === 0) {
    return (
      <section className="today-empty" aria-labelledby="timeline-title">
        <h2 id="timeline-title">Nothing planned yet.</h2>
        <p>Explore the city or keep the day flexible.</p>
      </section>
    )
  }

  const temporalState = tripNow
    ? getTimelineTemporalState(items, tripNow.minutesSinceMidnight)
    : { pastPrefixCount: 0, nowInsertIndex: -1 }
  const earlierItems = items.slice(0, temporalState.pastPrefixCount)
  const visibleItems = items.slice(temporalState.pastPrefixCount)

  const timelineContent = []
  for (let index = 0; index <= visibleItems.length; index += 1) {
    if (tripNow && index === temporalState.nowInsertIndex) {
      timelineContent.push(
        <li
          key="now"
          ref={nowMarkerRef}
          className="now-marker"
          aria-label={`Current time, ${tripNow.time}`}
        >
          <span aria-hidden="true">NOW · {tripNow.time}</span>
        </li>,
      )
    }

    const item = visibleItems[index]
    if (item) {
      timelineContent.push(
        <TimelineItemCard
          key={`${item.reference || item.title || item.type}-${index}`}
          item={item}
          selection={getEntitySelection(item)}
          onOpen={onOpenEntity}
        />,
      )
    }
  }

  return (
    <section className="timeline" aria-labelledby="timeline-title">
      <h2 id="timeline-title">Timeline</h2>
      <ol className="timeline__list">
        {earlierItems.length > 0 ? (
          <EarlierToday
            items={earlierItems}
            isExpanded={isEarlierExpanded}
            onToggle={() => setIsEarlierExpanded((expanded) => !expanded)}
            onOpenEntity={onOpenEntity}
          />
        ) : null}
        {timelineContent}
      </ol>
    </section>
  )
}
