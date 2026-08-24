import {
  getDaysForStage,
  getHotelForStage,
  getTransportsForStage,
} from '../../lib/tripData'
import type { IsoDate, Stage } from '../../types/trip'
import { StageCard } from './StageCard'
import { StageTransport } from './StageTransport'
import { getStageTemporalState } from './tripOverview'

export function StageList({
  stages,
  currentDate,
  expandedStageOrder,
  onExpandStage,
  onOpenHotel,
  onOpenTransport,
}: {
  stages: readonly Stage[]
  currentDate: IsoDate
  expandedStageOrder: number | null
  onExpandStage: (stageOrder: number) => void
  onOpenHotel: (stageOrder: number) => void
  onOpenTransport: (transportId: string) => void
}) {
  return (
    <section className="stage-list" aria-labelledby="stages-title">
      <div className="stage-list__heading">
        <p className="stage-list__eyebrow">The whole journey</p>
        <h2 id="stages-title">Stages</h2>
      </div>
      <ol className="stage-list__items">
        {stages.map((stage) => (
          <li className="stage-list__item" key={stage.stageOrder}>
            {getTransportsForStage(stage.stageOrder).map((transport) => (
              <StageTransport
                key={transport.id}
                transport={transport}
                onOpen={onOpenTransport}
              />
            ))}
            <StageCard
              stage={stage}
              days={getDaysForStage(stage.stageOrder)}
              hotel={getHotelForStage(stage.stageOrder)}
              state={getStageTemporalState(stage, currentDate)}
              isExpanded={expandedStageOrder === stage.stageOrder}
              onExpand={() => onExpandStage(stage.stageOrder)}
              onOpenHotel={onOpenHotel}
            />
          </li>
        ))}
      </ol>
    </section>
  )
}
