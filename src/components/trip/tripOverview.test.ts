import { describe, expect, it } from 'vitest'
import { getAllDays, getAllStages, getTrip } from '../../lib/tripData'
import {
  getDefaultExpandedStageOrder,
  getStageTemporalState,
  getTripProgress,
} from './tripOverview'

describe('Trip overview calendar state', () => {
  const stages = getAllStages()
  const days = getAllDays()
  const trip = getTrip()

  it('uses Stage 1 and zero progress before the trip', () => {
    expect(getDefaultExpandedStageOrder(stages, '2026-09-05')).toBe(1)
    expect(getTripProgress(days, trip.totalDays, '2026-09-05')).toMatchObject({
      dayNumber: 0,
      percent: 0,
    })
  })

  it('uses current Stage 4 and Day 5 during the trip', () => {
    expect(getDefaultExpandedStageOrder(stages, '2026-09-15')).toBe(4)
    expect(getTripProgress(days, trip.totalDays, '2026-09-15')).toMatchObject({
      dayNumber: 5,
      totalDays: 23,
    })
  })

  it('uses final Stage 14 and full progress after the trip', () => {
    expect(getDefaultExpandedStageOrder(stages, '2026-10-10')).toBe(14)
    expect(getTripProgress(days, trip.totalDays, '2026-10-10')).toMatchObject({
      dayNumber: 23,
      percent: 100,
    })
  })

  it('uses exclusive Stage end dates for past/current/future state', () => {
    const stage4 = stages.find(({ stageOrder }) => stageOrder === 4)
    if (!stage4) throw new Error('Expected generated Stage 4')

    expect(getStageTemporalState(stage4, '2026-09-14')).toBe('future')
    expect(getStageTemporalState(stage4, '2026-09-15')).toBe('current')
    expect(getStageTemporalState(stage4, '2026-09-16')).toBe('past')
  })
})
