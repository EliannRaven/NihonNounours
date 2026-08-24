import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { ActivityExplore } from '../components/explore/ActivityExplore'
import {
  EntityBottomSheet,
  type EntitySheetSelection,
} from '../components/sheets/EntityBottomSheet'
import { useTripNow } from '../components/today/todayTime'
import {
  filterActivities,
  getActivityAreaOptions,
  getActivityCityOptions,
  getActivityWeatherOptions,
  getDefaultActivityCity,
  normalizeActivityExploreParams,
  readActivityExploreFilters,
  resetActivityExploreParams,
  resolveActivityCity,
  updateActivityExploreParams,
  type ActivityExploreFilters,
} from '../lib/activityExplore'
import {
  readExploreContext,
  switchExploreMode,
  type ExploreMode,
} from '../lib/exploreContext'
import {
  getActivitiesForCity,
  getAllActivities,
  getAllDays,
  getAllStages,
  getTrip,
} from '../lib/tripData'

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selection, setSelection] = useState<EntitySheetSelection | null>(null)
  const context = readExploreContext(searchParams)
  const trip = getTrip()
  const tripNow = useTripNow(trip.timeZone)
  const cityOptions = getActivityCityOptions(getAllStages())
  const allActivities = getAllActivities()
  const defaultCity = getDefaultActivityCity(tripNow.date, getAllDays(), cityOptions)
  const activityCity = resolveActivityCity(context.city, cityOptions, defaultCity)
  const cityActivities = getActivitiesForCity(activityCity)
  const activityFilters = readActivityExploreFilters(
    searchParams,
    activityCity,
    cityActivities,
    allActivities,
  )
  const normalizedActivitySearch = normalizeActivityExploreParams(
    searchParams,
    activityFilters,
  ).toString()
  const currentSearch = searchParams.toString()

  useEffect(() => {
    if (context.mode === 'activities' && currentSearch !== normalizedActivitySearch) {
      setSearchParams(normalizedActivitySearch, { replace: true })
    }
  }, [context.mode, currentSearch, normalizedActivitySearch, setSearchParams])

  const selectMode = (mode: ExploreMode) => {
    setSearchParams(switchExploreMode(searchParams, mode))
  }

  const updateFilters = (changes: Partial<ActivityExploreFilters>) => {
    setSearchParams(updateActivityExploreParams(searchParams, changes))
  }

  const foodContextValues = [context.city, context.area, context.category].filter(
    (value): value is string => value !== null,
  )

  return (
    <>
      <PageContainer>
        <div className="explore-page">
        <header className="explore-header">
          <h1>Explore</h1>
          <p>Choose what you feel like discovering.</p>
        </header>

        <fieldset className="explore-mode">
          <legend className="visually-hidden">Explore mode</legend>
          <button
            type="button"
            aria-pressed={context.mode === 'activities'}
            onClick={() => selectMode('activities')}
          >
            Activities
          </button>
          <button
            type="button"
            aria-pressed={context.mode === 'food'}
            onClick={() => selectMode('food')}
          >
            Food
          </button>
        </fieldset>

        {context.mode === 'activities' ? (
          <ActivityExplore
            filters={activityFilters}
            cityOptions={cityOptions}
            areaOptions={getActivityAreaOptions(cityActivities)}
            weatherOptions={getActivityWeatherOptions(allActivities)}
            activities={filterActivities(allActivities, activityFilters)}
            onChangeFilters={updateFilters}
            onResetFilters={() =>
              setSearchParams(resetActivityExploreParams(searchParams, activityCity))
            }
            onOpenActivity={(id) => setSelection({ kind: 'activity', id })}
          />
        ) : (
          <section className="explore-context" aria-labelledby="explore-context-title">
            <h2 id="explore-context-title">Food</h2>
            {foodContextValues.length > 0 ? (
              <div className="explore-context__chips">
                {foodContextValues.map((value) => (
                  <span key={value} className="pill">{value}</span>
                ))}
              </div>
            ) : null}
          </section>
        )}
        </div>
      </PageContainer>
      <EntityBottomSheet selection={selection} onClose={() => setSelection(null)} />
    </>
  )
}
