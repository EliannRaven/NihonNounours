import type { Hotel, Stage, TripDay } from '../../types/trip'
import { StageDays } from './StageDays'
import { formatTripDateRange, type StageTemporalState } from './tripOverview'

function formatNights(nights: number | null) {
  if (nights === null) return null
  return `${nights} ${nights === 1 ? 'night' : 'nights'}`
}

export function StageCard({
  stage,
  days,
  hotel,
  state,
  isExpanded,
  onExpand,
  onOpenHotel,
}: {
  stage: Stage
  days: readonly TripDay[]
  hotel: Hotel | undefined
  state: StageTemporalState
  isExpanded: boolean
  onExpand: () => void
  onOpenHotel: (stageOrder: number) => void
}) {
  const panelId = `stage-panel-${stage.stageOrder}`
  const nights = formatNights(stage.nights)
  const stay = [formatTripDateRange(stage.startDate, stage.endDate), nights]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className={`stage-card stage-card--${state}`}>
      <h2 className="stage-card__heading">
        <button
          className="stage-card__toggle"
          type="button"
          aria-expanded={isExpanded}
          aria-controls={panelId}
          onClick={onExpand}
        >
          <span className="stage-card__number">Stage {stage.stageOrder}</span>
          <span className="stage-card__title-row">
            <span className="stage-card__city">{stage.city}</span>
            {state === 'current' ? <span className="stage-card__current">Current</span> : null}
          </span>
          {stage.japaneseName ? (
            <span className="stage-card__japanese">{stage.japaneseName}</span>
          ) : null}
          <span className="stage-card__stay">{stay}</span>
          <span className="stage-card__chevron" aria-hidden="true">⌄</span>
        </button>
      </h2>
      {isExpanded ? (
        <div className="stage-card__panel" id={panelId}>
          {hotel ? (
            <section className="stage-hotel" aria-label="Hotel">
              <h3>Hotel</h3>
              <button
                className="stage-hotel__button"
                type="button"
                aria-label={`${hotel.name}, open hotel details`}
                onClick={() => onOpenHotel(stage.stageOrder)}
              >
                <strong>{hotel.name}</strong>
                <span>
                  {[
                    hotel.checkinTime ? `Check-in ${hotel.checkinTime}` : null,
                    hotel.checkoutTime ? `Check-out ${hotel.checkoutTime}` : null,
                  ].filter(Boolean).join(' · ')}
                </span>
              </button>
            </section>
          ) : null}
          <StageDays days={days} />
        </div>
      ) : null}
    </article>
  )
}
