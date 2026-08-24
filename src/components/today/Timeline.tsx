import type { EntitySheetSelection } from '../sheets/EntityBottomSheet'
import type { TimelineItem as TimelineItemType } from '../../types/trip'
import { TimelineItemCard } from './TimelineItemCard'
import { getEntitySelection } from './todayUtils'

export function Timeline({
  items,
  onOpenEntity,
}: {
  items: readonly TimelineItemType[]
  onOpenEntity: (selection: EntitySheetSelection) => void
}) {
  if (items.length === 0) {
    return (
      <section className="today-empty" aria-labelledby="timeline-title">
        <h2 id="timeline-title">Nothing planned yet.</h2>
        <p>Explore the city or keep the day flexible.</p>
      </section>
    )
  }

  return (
    <section className="timeline" aria-labelledby="timeline-title">
      <h2 id="timeline-title">Timeline</h2>
      <ol className="timeline__list">
        {items.map((item, index) => (
          <TimelineItemCard
            key={`${item.reference || item.title || item.type}-${index}`}
            item={item}
            selection={getEntitySelection(item)}
            onOpen={onOpenEntity}
          />
        ))}
      </ol>
    </section>
  )
}
