import type { DiscoveryMetadata } from '../types/trip'

export type ExploreMode = 'activities' | 'food'

export interface ExploreContext {
  mode: ExploreMode
  city: string | null
  area: string | null
  category: string | null
}

function normalizeOptionalValue(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function setOptionalParam(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
) {
  const normalized = normalizeOptionalValue(value)
  if (normalized) params.set(key, normalized)
}

export function buildExploreSearchParams(
  discovery: DiscoveryMetadata,
): URLSearchParams {
  const params = new URLSearchParams()
  params.set('mode', discovery.mode)
  setOptionalParam(params, 'city', discovery.city)
  setOptionalParam(params, 'area', discovery.area)
  if (discovery.mode === 'food') {
    setOptionalParam(params, 'category', discovery.category)
  }
  return params
}

export function readExploreContext(searchParams: URLSearchParams): ExploreContext {
  const requestedMode = searchParams.get('mode')
  const mode: ExploreMode = requestedMode === 'food' ? 'food' : 'activities'
  return {
    mode,
    city: normalizeOptionalValue(searchParams.get('city')),
    area: normalizeOptionalValue(searchParams.get('area')),
    category:
      mode === 'food'
        ? normalizeOptionalValue(searchParams.get('category'))
        : null,
  }
}

export function switchExploreMode(
  searchParams: URLSearchParams,
  mode: ExploreMode,
) {
  const currentContext = readExploreContext(searchParams)
  const discovery: DiscoveryMetadata =
    mode === 'food'
      ? {
          mode,
          city: currentContext.city,
          area: currentContext.area,
          category:
            currentContext.mode === 'food' ? currentContext.category : null,
        }
      : {
          mode,
          city: currentContext.city,
          area: currentContext.area,
        }
  const nextParams = new URLSearchParams(searchParams)
  for (const key of ['mode', 'city', 'area', 'category']) {
    nextParams.delete(key)
  }
  buildExploreSearchParams(discovery).forEach((value, key) => {
    nextParams.set(key, value)
  })
  return nextParams
}
