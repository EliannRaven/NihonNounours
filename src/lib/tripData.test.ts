import { describe, expect, it } from 'vitest'
import {
  getActivitiesForCity,
  getActivity,
  getAllDays,
  getAllStages,
  getDay,
  getDefaultTripDate,
  getFavoriteActivities,
  getFavoriteFood,
  getFood,
  getFoodForCity,
  getHotelForStage,
  getMajorTransportsForDate,
  getStage,
  getStageForDate,
  getTimelineForDate,
  getTransport,
  getTrip,
  resolveTripDate,
  tripData,
} from './tripData'

describe('trip dataset', () => {
  it('loads schema version 1', () => {
    expect(tripData.schemaVersion).toBe(1)
  })

  it('exposes the generated trip metadata', () => {
    expect(getTrip()).toEqual({
      name: 'Japan 2026',
      timeZone: 'Asia/Tokyo',
      startDate: '2026-09-11',
      endDate: '2026-10-04',
      totalDays: 23,
    })
  })
})

describe('stage selectors', () => {
  it('returns all 14 stages', () => {
    expect(getAllStages()).toHaveLength(14)
  })

  it('finds Stage 4 Kamakura', () => {
    expect(getStage(4)).toMatchObject({ stageOrder: 4, city: 'Kamakura' })
  })

  it('returns undefined for an unknown Stage', () => {
    expect(getStage(999)).toBeUndefined()
  })

  it('finds Stage 3 Tokyo on September 14', () => {
    expect(getStageForDate('2026-09-14')).toMatchObject({
      stageOrder: 3,
      city: 'Tokyo',
    })
  })

  it('assigns the exclusive boundary to Stage 4 Kamakura', () => {
    expect(getStageForDate('2026-09-15')).toMatchObject({
      stageOrder: 4,
      city: 'Kamakura',
    })
  })

  it('returns undefined on the exclusive trip end', () => {
    expect(getStageForDate('2026-10-04')).toBeUndefined()
  })
})

describe('day selectors', () => {
  it('returns all generated days in chronological order', () => {
    const days = getAllDays()

    expect(days).toHaveLength(23)
    expect(days[0]?.date).toBe('2026-09-11')
    expect(days.at(-1)?.date).toBe('2026-10-03')
  })

  it('returns a new days array without mutating generated data', () => {
    const days = getAllDays()
    days.reverse()

    expect(getAllDays()[0]?.date).toBe('2026-09-11')
  })

  it('returns Day 1 on September 11', () => {
    expect(getDay('2026-09-11')?.dayNumber).toBe(1)
  })

  it('returns Day 5 on September 15', () => {
    expect(getDay('2026-09-15')?.dayNumber).toBe(5)
  })

  it('returns Day 23 on October 3', () => {
    expect(getDay('2026-10-03')?.dayNumber).toBe(23)
  })

  it('returns undefined on the exclusive end date', () => {
    expect(getDay('2026-10-04')).toBeUndefined()
  })
})

describe('entity selectors', () => {
  it('finds ACT015 Hasedera Temple', () => {
    expect(getActivity('ACT015')?.name).toBe('Hasedera Temple')
  })

  it('returns undefined for an unknown Activity', () => {
    expect(getActivity('ACT999')).toBeUndefined()
  })

  it('looks up Food by ID', () => {
    expect(getFood('FOD001')?.name).toBe('Soba Yamagata')
  })

  it('keeps explicit Transport IDs independent from Stage order', () => {
    expect(getTransport('TRA008')?.stageOrder).toBe(11)
  })

  it('finds the Kamakura Hotel by Stage order', () => {
    expect(getHotelForStage(4)?.name).toBe(
      'plat hostel keikyu kamakura wave',
    )
  })
})

describe('collection selectors', () => {
  it('filters Activities by trimmed case-insensitive city', () => {
    const activities = getActivitiesForCity('  kAmAkUrA ')

    expect(activities.map(({ id }) => id)).toContain('ACT015')
    expect(activities.every(({ city }) => city === 'Kamakura')).toBe(true)
  })

  it('filters Food by trimmed case-insensitive city', () => {
    const food = getFood('FOD001')
    const city = food?.city
    if (!city) {
      throw new Error('FOD001 must have a city in the generated test dataset')
    }

    const matches = getFoodForCity(`  ${city.toUpperCase()}  `)
    expect(matches.map(({ id }) => id)).toContain('FOD001')
  })

  it('returns only favorite Activities', () => {
    const favorites = getFavoriteActivities()

    expect(favorites.length).toBeGreaterThan(0)
    expect(favorites.every(({ favorite }) => favorite)).toBe(true)
  })

  it('returns only favorite Food', () => {
    const favorites = getFavoriteFood()

    expect(favorites.length).toBeGreaterThan(0)
    expect(favorites.every(({ favorite }) => favorite)).toBe(true)
  })
})

describe('timeline selectors', () => {
  it('returns the authored September 12 timeline', () => {
    const timeline = getTimelineForDate('2026-09-12')

    expect(timeline.some(({ reference }) => reference === 'ACT001')).toBe(true)
    expect(
      timeline.some(
        ({ type, reference }) => type === 'transport' && reference === null,
      ),
    ).toBe(true)
  })

  it('preserves the local Transport major flag', () => {
    const localTransport = getTimelineForDate('2026-09-12').find(
      ({ type, reference }) => type === 'transport' && reference === null,
    )

    expect(localTransport?.isMajorTransport).toBe(false)
  })

  it('finds TRA004 as a major Transport on September 15', () => {
    const transports = getMajorTransportsForDate('2026-09-15')

    expect(transports).toContainEqual(
      expect.objectContaining({
        reference: 'TRA004',
        isMajorTransport: true,
      }),
    )
  })

  it('preserves flexible Food discovery metadata', () => {
    const flexibleFood = getTimelineForDate('2026-09-15').find(
      ({ discovery }) => discovery?.mode === 'food',
    )

    expect(flexibleFood?.discovery).toMatchObject({
      mode: 'food',
      category: 'Meal',
    })
  })

  it('returns an empty timeline outside the trip', () => {
    expect(getTimelineForDate('2026-10-04')).toEqual([])
  })
})

describe('trip date selection', () => {
  it('uses the trip start before the trip', () => {
    expect(getDefaultTripDate(new Date('2026-09-10T00:00:00Z'))).toBe(
      '2026-09-11',
    )
  })

  it('uses the Asia/Tokyo calendar date during the trip', () => {
    const japaneseMidnight = new Date('2026-09-14T15:30:00Z')

    expect(getDefaultTripDate(japaneseMidnight)).toBe('2026-09-15')
  })

  it('uses the final active date after the trip', () => {
    expect(getDefaultTripDate(new Date('2026-10-04T00:00:00Z'))).toBe(
      '2026-10-03',
    )
  })

  it('accepts a generated Day as an explicit override', () => {
    expect(resolveTripDate('2026-09-15')).toBe('2026-09-15')
  })

  it('falls back when an explicit override is outside the trip', () => {
    expect(
      resolveTripDate('2026-10-04', new Date('2026-09-10T00:00:00Z')),
    ).toBe('2026-09-11')
  })
})

describe('immutability', () => {
  it('returns collection copies without mutating imported data', () => {
    const stages = getAllStages()
    const timeline = getTimelineForDate('2026-09-12')
    const activities = getActivitiesForCity('Kamakura')
    const originalTimelineLength = timeline.length
    const originalActivityIds = activities.map(({ id }) => id)

    stages.pop()
    timeline.pop()
    activities.reverse()

    expect(getAllStages()).toHaveLength(14)
    expect(getTimelineForDate('2026-09-12')).toHaveLength(
      originalTimelineLength,
    )
    expect(getActivitiesForCity('Kamakura').map(({ id }) => id)).toEqual(
      originalActivityIds,
    )
  })
})
