import type { Activity } from '../types/trip'

export type ActivityTimeFilter = 'all' | 'under-1h' | '1-2h' | 'half-day'

export interface ActivityExploreFilters {
  city: string
  area: string | null
  weather: string | null
  time: ActivityTimeFilter
  favorites: boolean
}

export interface ActivityWeatherOption {
  key: string
  label: string
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function comparable(value: string) {
  return value.trim().toLocaleLowerCase()
}

export function getWeatherKey(value: string) {
  return comparable(value).replace(/\s+/g, '-')
}

export function getActivityAreaOptions(
  activities: readonly Activity[],
): string[] {
  const areas = new Map<string, string>()
  for (const activity of activities) {
    const area = normalizeText(activity.area)
    if (area && !areas.has(comparable(area))) {
      areas.set(comparable(area), area)
    }
  }
  return [...areas.values()].sort((first, second) =>
    first.localeCompare(second),
  )
}

export function getActivityWeatherOptions(
  activities: readonly Activity[],
): ActivityWeatherOption[] {
  const options = new Map<string, ActivityWeatherOption>()
  for (const activity of activities) {
    const label = normalizeText(activity.weather)
    if (!label) continue
    const key = getWeatherKey(label)
    if (!options.has(key)) options.set(key, { key, label })
  }
  return [...options.values()].sort((first, second) =>
    first.label.localeCompare(second.label),
  )
}

export function readActivityExploreFilters(
  searchParams: URLSearchParams,
  city: string,
  cityActivities: readonly Activity[],
  allActivities: readonly Activity[],
): ActivityExploreFilters {
  const requestedArea = normalizeText(searchParams.get('area'))
  const area = requestedArea
    ? getActivityAreaOptions(cityActivities).find(
        (option) => comparable(option) === comparable(requestedArea),
      ) ?? null
    : null
  const requestedWeather = normalizeText(searchParams.get('weather'))
  const weather = requestedWeather
    ? getActivityWeatherOptions(allActivities).find(
        (option) => option.key === getWeatherKey(requestedWeather),
      )?.key ?? null
    : null
  const requestedTime = searchParams.get('time')
  const time: ActivityTimeFilter =
    requestedTime === 'under-1h' ||
    requestedTime === '1-2h' ||
    requestedTime === 'half-day'
      ? requestedTime
      : 'all'

  return {
    city,
    area,
    weather,
    time,
    favorites: searchParams.get('favorites') === '1',
  }
}

function matchesTimeFilter(
  durationMin: number | null,
  time: ActivityTimeFilter,
) {
  if (time === 'all') return true
  if (durationMin === null) return false
  if (time === 'under-1h') return durationMin < 60
  if (time === '1-2h') return durationMin >= 60 && durationMin <= 120
  return durationMin > 120
}

export function filterActivities(
  activities: readonly Activity[],
  filters: ActivityExploreFilters,
): Activity[] {
  return activities.filter((activity) => {
    if (!activity.city || comparable(activity.city) !== comparable(filters.city)) {
      return false
    }
    if (
      filters.area &&
      (!activity.area || comparable(activity.area) !== comparable(filters.area))
    ) {
      return false
    }
    if (
      filters.weather &&
      (!activity.weather || getWeatherKey(activity.weather) !== filters.weather)
    ) {
      return false
    }
    if (!matchesTimeFilter(activity.durationMin, filters.time)) return false
    return !filters.favorites || activity.favorite
  })
}

export function normalizeActivityExploreParams(
  searchParams: URLSearchParams,
  filters: ActivityExploreFilters,
) {
  const nextParams = new URLSearchParams(searchParams)
  for (const key of ['mode', 'city', 'area', 'category', 'weather', 'time', 'favorites']) {
    nextParams.delete(key)
  }
  nextParams.set('mode', 'activities')
  nextParams.set('city', filters.city)
  if (filters.area) nextParams.set('area', filters.area)
  if (filters.weather) nextParams.set('weather', filters.weather)
  if (filters.time !== 'all') nextParams.set('time', filters.time)
  if (filters.favorites) nextParams.set('favorites', '1')
  return nextParams
}

export function updateActivityExploreParams(
  searchParams: URLSearchParams,
  changes: Partial<ActivityExploreFilters>,
) {
  const nextParams = new URLSearchParams(searchParams)
  nextParams.set('mode', 'activities')
  nextParams.delete('category')

  if (Object.hasOwn(changes, 'city') && changes.city) {
    nextParams.set('city', changes.city)
    nextParams.delete('area')
  }
  if (Object.hasOwn(changes, 'area')) {
    if (changes.area) nextParams.set('area', changes.area)
    else nextParams.delete('area')
  }
  if (Object.hasOwn(changes, 'weather')) {
    if (changes.weather) nextParams.set('weather', changes.weather)
    else nextParams.delete('weather')
  }
  if (Object.hasOwn(changes, 'time')) {
    if (changes.time && changes.time !== 'all') {
      nextParams.set('time', changes.time)
    } else nextParams.delete('time')
  }
  if (Object.hasOwn(changes, 'favorites')) {
    if (changes.favorites) nextParams.set('favorites', '1')
    else nextParams.delete('favorites')
  }
  return nextParams
}

export function resetActivityExploreParams(
  searchParams: URLSearchParams,
  city: string,
) {
  const nextParams = new URLSearchParams(searchParams)
  for (const key of ['area', 'weather', 'time', 'favorites', 'category']) {
    nextParams.delete(key)
  }
  nextParams.set('mode', 'activities')
  nextParams.set('city', city)
  return nextParams
}
