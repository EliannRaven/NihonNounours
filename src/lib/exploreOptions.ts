import type { IsoDate, Stage, TripDay } from '../types/trip'

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function comparable(value: string) {
  return value.trim().toLocaleLowerCase()
}

export function getExploreCityOptions(stages: readonly Stage[]): string[] {
  const seen = new Set<string>()
  const cities: string[] = []
  for (const stage of stages) {
    const city = normalizeText(stage.city)
    if (!city) continue
    const key = comparable(city)
    if (!seen.has(key)) {
      seen.add(key)
      cities.push(city)
    }
  }
  return cities
}

export function getDefaultExploreCity(
  currentDate: IsoDate,
  days: readonly TripDay[],
  cityOptions: readonly string[],
): string {
  const firstDay = days[0]
  const finalDay = days.at(-1)
  const contextualDay =
    firstDay && currentDate < firstDay.date
      ? firstDay
      : finalDay && currentDate > finalDay.date
        ? finalDay
        : days.find((day) => day.date === currentDate)
  const contextualCity = normalizeText(contextualDay?.city)
  return contextualCity ?? cityOptions[0] ?? ''
}

export function resolveExploreCity(
  requestedCity: string | null,
  cityOptions: readonly string[],
  defaultCity: string,
) {
  const requested = normalizeText(requestedCity)
  return (
    (requested
      ? cityOptions.find((city) => comparable(city) === comparable(requested))
      : undefined) ?? defaultCity
  )
}
