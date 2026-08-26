import { describe, expect, it } from 'vitest'
import type { Activity } from '../types/trip'
import {
  filterActivities,
  getActivityAreaOptions,
  getActivityWeatherOptions,
  normalizeActivityExploreParams,
  readActivityExploreFilters,
  resetActivityExploreParams,
  updateActivityExploreParams,
  type ActivityExploreFilters,
  type ActivityTimeFilter,
} from './activityExplore'
import {
  getDefaultExploreCity,
  getExploreCityOptions,
} from './exploreOptions'
import {
  getActivitiesForCity,
  getAllActivities,
  getAllDays,
  getAllStages,
} from './tripData'

function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'ACT-TEST',
    name: 'Test Activity',
    city: 'Kamakura',
    area: 'Hase',
    category: 'Culture',
    durationMin: 75,
    weather: 'Sunny',
    favorite: false,
    reservation: null,
    about: null,
    info: null,
    important: null,
    ourNotes: null,
    websiteLink: null,
    ...overrides,
  }
}

function filters(overrides: Partial<ActivityExploreFilters> = {}): ActivityExploreFilters {
  return {
    city: 'Kamakura',
    area: null,
    weather: null,
    time: 'all',
    favorites: false,
    ...overrides,
  }
}

describe('Activity Explore filtering', () => {
  const activities = [
    activity({ id: 'hase', favorite: true }),
    activity({ id: 'sasuke', area: 'Sasuke', durationMin: 45, weather: null }),
    activity({ id: 'kyoto', city: 'Kyoto', area: null }),
  ]

  it('filters by city and area', () => {
    expect(filterActivities(activities, filters()).map(({ id }) => id)).toEqual([
      'hase',
      'sasuke',
    ])
    expect(
      filterActivities(activities, filters({ area: 'Hase' })).map(({ id }) => id),
    ).toEqual(['hase'])
  })

  it('matches authored weather and excludes null weather precisely', () => {
    expect(
      filterActivities(activities, filters({ weather: 'sunny' })).map(({ id }) => id),
    ).toEqual(['hase'])
  })

  it.each<[number | null, ActivityTimeFilter, boolean]>([
    [59, 'under-1h', true],
    [60, 'under-1h', false],
    [60, '1-2h', true],
    [120, '1-2h', true],
    [121, '1-2h', false],
    [121, 'half-day', true],
    [null, 'under-1h', false],
    [null, '1-2h', false],
    [null, 'half-day', false],
  ])('handles duration %s with %s', (durationMin, time, expected) => {
    expect(
      filterActivities([activity({ durationMin })], filters({ time })),
    ).toHaveLength(expected ? 1 : 0)
  })

  it('filters favorites and combines every filter with AND logic', () => {
    expect(
      filterActivities(activities, filters({ favorites: true })).map(({ id }) => id),
    ).toEqual(['hase'])
    expect(
      filterActivities(
        activities,
        filters({ area: 'Hase', weather: 'sunny', time: '1-2h', favorites: true }),
      ).map(({ id }) => id),
    ).toEqual(['hase'])
  })

  it('does not mutate the source array or objects', () => {
    const source = [activity()]
    const original = structuredClone(source)
    const result = filterActivities(source, filters({ favorites: true }))

    expect(source).toEqual(original)
    expect(source[0]).toEqual(original[0])
    expect(result).not.toBe(source)
  })
})

describe('Activity Explore generated options', () => {
  it('deduplicates stage cities in first-trip appearance order', () => {
    const cities = getExploreCityOptions(getAllStages())

    expect(cities.slice(0, 5)).toEqual([
      'Sendai',
      'Hiraizumi',
      'Tokyo',
      'Kamakura',
      'Hakone',
    ])
    expect(cities.filter((city) => city === 'Tokyo')).toHaveLength(1)
  })

  it('derives sorted nonblank areas from the selected city', () => {
    const areas = getActivityAreaOptions(getActivitiesForCity('Kamakura'))

    expect(areas).toContain('Hase')
    expect(areas).toContain('Sasuke')
    expect(areas).not.toContain(null)
    expect(getActivityAreaOptions([activity({ area: null }), activity({ area: '  ' })])).toEqual([])
  })

  it('derives only authored non-null weather options', () => {
    const options = getActivityWeatherOptions(getAllActivities())

    expect(options).toEqual([{ key: 'sunny', label: 'Sunny' }])
  })

  it('resolves contextual city before, during, and after the trip', () => {
    const days = getAllDays()
    const cities = getExploreCityOptions(getAllStages())

    expect(getDefaultExploreCity('2026-09-05', days, cities)).toBe('Sendai')
    expect(getDefaultExploreCity('2026-09-15', days, cities)).toBe('Kamakura')
    expect(getDefaultExploreCity('2026-09-18', days, cities)).toBe('Kyoto')
    expect(getDefaultExploreCity('2026-10-10', days, cities)).toBe('Tokyo')
  })
})

describe('Activity Explore URL state', () => {
  const allActivities = getAllActivities()
  const cityActivities = getActivitiesForCity('Kamakura')

  it('uses safe defaults for missing and invalid filters', () => {
    const parsed = readActivityExploreFilters(
      new URLSearchParams('area=Unknown&weather=banana&time=forever&favorites=no'),
      'Kamakura',
      cityActivities,
      allActivities,
    )

    expect(parsed).toEqual(filters())
  })

  it('accepts canonical URL values and favorites=1 only', () => {
    expect(
      readActivityExploreFilters(
        new URLSearchParams('area=hase&weather=SUNNY&time=1-2h&favorites=1'),
        'Kamakura',
        cityActivities,
        allActivities,
      ),
    ).toEqual(filters({ area: 'Hase', weather: 'sunny', time: '1-2h', favorites: true }))
  })

  it('normalizes invalid and default filters away while preserving future params', () => {
    const params = normalizeActivityExploreParams(
      new URLSearchParams('mode=banana&category=Meal&weather=bad&future=kept'),
      filters(),
    )

    expect(Object.fromEntries(params)).toEqual({
      future: 'kept',
      mode: 'activities',
      city: 'Kamakura',
    })
  })

  it('removes area, weather, time, and favorites when selecting their defaults', () => {
    const start = new URLSearchParams(
      'mode=activities&city=Kamakura&area=Hase&weather=sunny&time=1-2h&favorites=1',
    )
    const withoutArea = updateActivityExploreParams(start, { area: null })
    const withoutWeather = updateActivityExploreParams(withoutArea, { weather: null })
    const withoutTime = updateActivityExploreParams(withoutWeather, { time: 'all' })
    const withoutFavorites = updateActivityExploreParams(withoutTime, { favorites: false })

    expect(Object.fromEntries(withoutFavorites)).toEqual({
      mode: 'activities',
      city: 'Kamakura',
    })
  })

  it('clears city-specific area while preserving other valid filters', () => {
    const params = updateActivityExploreParams(
      new URLSearchParams(
        'mode=activities&city=Kamakura&area=Hase&weather=sunny&favorites=1',
      ),
      { city: 'Hakone' },
    )

    expect(params.get('city')).toBe('Hakone')
    expect(params.has('area')).toBe(false)
    expect(params.get('weather')).toBe('sunny')
    expect(params.get('favorites')).toBe('1')
  })

  it('resets filters but preserves city and unrelated parameters', () => {
    const params = resetActivityExploreParams(
      new URLSearchParams(
        'mode=activities&city=Kamakura&area=Hase&weather=sunny&time=under-1h&favorites=1&future=kept',
      ),
      'Kamakura',
    )

    expect(Object.fromEntries(params)).toEqual({
      mode: 'activities',
      city: 'Kamakura',
      future: 'kept',
    })
  })
})
