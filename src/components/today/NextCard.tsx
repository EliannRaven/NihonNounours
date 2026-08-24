import type { EntitySheetSelection } from '../sheets/EntityBottomSheet'
import type { NextTimelineTarget } from './nextTimeline'
import { getLeaveGuidance } from './nextTimeline'
import { getTimelinePresentation } from './todayUtils'

interface NextCardProps {
  target: NextTimelineTarget
  currentMinutes: number
  onOpenEntity: (selection: EntitySheetSelection) => void
}

export function NextCard({
  target,
  currentMinutes,
  onOpenEntity,
}: NextCardProps) {
  const { item } = target
  const presentation = getTimelinePresentation(item, true)
  const title = item.title || presentation.label
  const leaveGuidance = getLeaveGuidance(target, currentMinutes)
  const accessibleTime = item.startTime ? `, ${item.startTime}` : ''

  return (
    <section className="next-card" aria-labelledby="next-card-title">
      <h2 id="next-card-title">NEXT</h2>
      <button
        className={`next-card__target is-${presentation.className}`}
        type="button"
        aria-label={`Next: ${title}${accessibleTime}`}
        onClick={() => onOpenEntity(target.selection)}
      >
        <span className="next-card__accent" aria-hidden="true" />
        <span className="next-card__content">
          {item.startTime ? (
            <span className="next-card__time">{item.startTime}</span>
          ) : null}
          <span className="next-card__title">
            {title}
            {item.favorite ? <span aria-label="Favorite"> 🐻</span> : null}
          </span>
          <span className="next-card__metadata">
            <span>
              <span aria-hidden="true">{presentation.symbol}</span>{' '}
              {presentation.label}
            </span>
            {item.area ? <span>{item.area}</span> : null}
            {item.durationMin !== null ? (
              <span>{item.durationMin} min</span>
            ) : null}
            {item.status ? <span>{item.status}</span> : null}
          </span>
        </span>
      </button>

      {leaveGuidance ? (
        <p className={`next-card__leave is-${leaveGuidance.kind}`}>
          {leaveGuidance.label}
        </p>
      ) : null}

      {target.contextualTransports.length > 0 ? (
        <section className="next-card__travel" aria-labelledby="getting-there-title">
          <h3 id="getting-there-title">Getting there</h3>
          <ul>
            {target.contextualTransports.map((transport, index) => (
              <li key={`${transport.title || 'transport'}-${index}`}>
                <span aria-hidden="true">🚇</span>
                <span>{transport.title || 'Local transport'}</span>
                {transport.durationMin !== null ? (
                  <span>{transport.durationMin} min</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  )
}
