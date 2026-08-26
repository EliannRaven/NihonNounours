import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { ActivityExplore } from '../components/explore/ActivityExplore'
import { FoodExplore } from '../components/explore/FoodExplore'
import {
  EntityBottomSheet,
  type EntitySheetSelection,
} from '../components/sheets/EntityBottomSheet'
import { useTripNow } from '../components/today/todayTime'
import {
  filterActivities,
  getActivityAreaOptions,
  getActivityWeatherOptions,
  normalizeActivityExploreParams,
  readActivityExploreFilters,
  resetActivityExploreParams,
  updateActivityExploreParams,
  type ActivityExploreFilters,
} from '../lib/activityExplore'
import {
  readExploreContext,
  switchExploreMode,
  type ExploreMode,
} from '../lib/exploreContext'
import {
  getDefaultExploreCity,
  getExploreCityOptions,
  resolveExploreCity,
} from '../lib/exploreOptions'
import {
  filterFood,
  getFoodAreaOptions,
  getFoodCategoryOptions,
  normalizeFoodExploreParams,
  readFoodExploreFilters,
  resetFoodExploreParams,
  updateFoodExploreParams,
  type FoodExploreFilters,
} from '../lib/foodExplore'
import {
  getActivitiesForCity,
  getAllActivities,
  getAllDays,
  getAllFood,
  getAllStages,
  getFoodForCity,
  getTrip,
} from '../lib/tripData'

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selection, setSelection] = useState<EntitySheetSelection | null>(null)
  const context = readExploreContext(searchParams)
  const trip = getTrip()
  const tripNow = useTripNow(trip.timeZone)
  const cityOptions = getExploreCityOptions(getAllStages())
  const defaultCity = getDefaultExploreCity(tripNow.date, getAllDays(), cityOptions)
  const allActivities = getAllActivities()
  const activityCity = resolveExploreCity(context.city, cityOptions, defaultCity)
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
  const allFood = getAllFood()
  const foodCity = resolveExploreCity(context.city, cityOptions, defaultCity)
  const cityFood = getFoodForCity(foodCity)
  const foodFilters = readFoodExploreFilters(
    searchParams,
    foodCity,
    cityFood,
    allFood,
  )
  const normalizedFoodSearch = normalizeFoodExploreParams(
    searchParams,
    foodFilters,
  ).toString()
  const currentSearch = searchParams.toString()

  useEffect(() => {
    const normalizedSearch =
      context.mode === 'activities'
        ? normalizedActivitySearch
        : normalizedFoodSearch
    if (currentSearch !== normalizedSearch) {
      setSearchParams(normalizedSearch, { replace: true })
    }
  }, [
    context.mode,
    currentSearch,
    normalizedActivitySearch,
    normalizedFoodSearch,
    setSearchParams,
  ])

  const selectMode = (mode: ExploreMode) => {
    setSearchParams(switchExploreMode(searchParams, mode))
  }

  const updateActivityFilters = (changes: Partial<ActivityExploreFilters>) => {
    setSearchParams(updateActivityExploreParams(searchParams, changes))
  }

  const updateFoodFilters = (changes: Partial<FoodExploreFilters>) => {
    setSearchParams(updateFoodExploreParams(searchParams, changes))
  }

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
              onChangeFilters={updateActivityFilters}
              onResetFilters={() =>
                setSearchParams(resetActivityExploreParams(searchParams, activityCity))
              }
              onOpenActivity={(id) => setSelection({ kind: 'activity', id })}
            />
          ) : (
            <FoodExplore
              filters={foodFilters}
              cityOptions={cityOptions}
              areaOptions={getFoodAreaOptions(cityFood, foodFilters.area)}
              categoryOptions={getFoodCategoryOptions(allFood)}
              food={filterFood(allFood, foodFilters)}
              onChangeFilters={updateFoodFilters}
              onResetFilters={() =>
                setSearchParams(resetFoodExploreParams(searchParams, foodCity))
              }
              onOpenFood={(id) => setSelection({ kind: 'food', id })}
            />
          )}
        </div>
      </PageContainer>
      <EntityBottomSheet selection={selection} onClose={() => setSelection(null)} />
    </>
  )
}
