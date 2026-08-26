import type { Food } from '../types/trip'

export interface FoodExploreFilters {
  city: string
  area: string | null
  category: string | null
  favorites: boolean
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function comparable(value: string) {
  return value.trim().toLocaleLowerCase()
}

function getUniqueSortedValues(values: readonly (string | null)[]) {
  const options = new Map<string, string>()
  for (const value of values) {
    const normalized = normalizeText(value)
    if (normalized && !options.has(comparable(normalized))) {
      options.set(comparable(normalized), normalized)
    }
  }
  return [...options.values()].sort((first, second) =>
    first.localeCompare(second),
  )
}

export function getFoodAreaOptions(
  food: readonly Food[],
  contextualArea: string | null = null,
): string[] {
  const registryAreas = getUniqueSortedValues(food.map((item) => item.area))
  const context = normalizeText(contextualArea)
  if (!context) return registryAreas

  const matchingRegistryArea = registryAreas.find(
    (area) => comparable(area) === comparable(context),
  )
  return matchingRegistryArea
    ? registryAreas
    : [context, ...registryAreas]
}

export function getFoodCategoryOptions(food: readonly Food[]): string[] {
  return getUniqueSortedValues(food.map((item) => item.category))
}

export function readFoodExploreFilters(
  searchParams: URLSearchParams,
  city: string,
  cityFood: readonly Food[],
  allFood: readonly Food[],
): FoodExploreFilters {
  const requestedArea = normalizeText(searchParams.get('area'))
  const area = requestedArea
    ? getFoodAreaOptions(cityFood, requestedArea).find(
        (option) => comparable(option) === comparable(requestedArea),
      ) ?? null
    : null
  const requestedCategory = normalizeText(searchParams.get('category'))
  const category = requestedCategory
    ? getFoodCategoryOptions(allFood).find(
        (option) => comparable(option) === comparable(requestedCategory),
      ) ?? null
    : null

  return {
    city,
    area,
    category,
    favorites: searchParams.get('favorites') === '1',
  }
}

export function filterFood(
  food: readonly Food[],
  filters: FoodExploreFilters,
): Food[] {
  return food.filter((item) => {
    if (!item.city || comparable(item.city) !== comparable(filters.city)) {
      return false
    }
    if (
      filters.area &&
      (!item.area || comparable(item.area) !== comparable(filters.area))
    ) {
      return false
    }
    if (
      filters.category &&
      (!item.category || comparable(item.category) !== comparable(filters.category))
    ) {
      return false
    }
    return !filters.favorites || item.favorite
  })
}

export function normalizeFoodExploreParams(
  searchParams: URLSearchParams,
  filters: FoodExploreFilters,
) {
  const nextParams = new URLSearchParams(searchParams)
  for (const key of ['mode', 'city', 'area', 'category', 'weather', 'time', 'favorites']) {
    nextParams.delete(key)
  }
  nextParams.set('mode', 'food')
  nextParams.set('city', filters.city)
  if (filters.area) nextParams.set('area', filters.area)
  if (filters.category) nextParams.set('category', filters.category)
  if (filters.favorites) nextParams.set('favorites', '1')
  return nextParams
}

export function updateFoodExploreParams(
  searchParams: URLSearchParams,
  changes: Partial<FoodExploreFilters>,
) {
  const nextParams = new URLSearchParams(searchParams)
  nextParams.set('mode', 'food')
  nextParams.delete('weather')
  nextParams.delete('time')

  if (Object.hasOwn(changes, 'city') && changes.city) {
    nextParams.set('city', changes.city)
    nextParams.delete('area')
  }
  if (Object.hasOwn(changes, 'area')) {
    if (changes.area) nextParams.set('area', changes.area)
    else nextParams.delete('area')
  }
  if (Object.hasOwn(changes, 'category')) {
    if (changes.category) nextParams.set('category', changes.category)
    else nextParams.delete('category')
  }
  if (Object.hasOwn(changes, 'favorites')) {
    if (changes.favorites) nextParams.set('favorites', '1')
    else nextParams.delete('favorites')
  }
  return nextParams
}

export function resetFoodExploreParams(
  searchParams: URLSearchParams,
  city: string,
) {
  const nextParams = new URLSearchParams(searchParams)
  for (const key of ['area', 'category', 'favorites', 'weather', 'time']) {
    nextParams.delete(key)
  }
  nextParams.set('mode', 'food')
  nextParams.set('city', city)
  return nextParams
}
