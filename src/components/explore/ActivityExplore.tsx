import type {
  ActivityExploreFilters,
  ActivityWeatherOption,
} from '../../lib/activityExplore'
import type { Activity } from '../../types/trip'
import { ActivityCard } from './ActivityCard'
import { ActivityFilters } from './ActivityFilters'

export function ActivityExplore({
  filters,
  cityOptions,
  areaOptions,
  weatherOptions,
  activities,
  onChangeFilters,
  onResetFilters,
  onOpenActivity,
}: {
  filters: ActivityExploreFilters
  cityOptions: readonly string[]
  areaOptions: readonly string[]
  weatherOptions: readonly ActivityWeatherOption[]
  activities: readonly Activity[]
  onChangeFilters: (changes: Partial<ActivityExploreFilters>) => void
  onResetFilters: () => void
  onOpenActivity: (activityId: string) => void
}) {
  return (
    <section className="activity-explore" aria-labelledby="activity-explore-title">
      <header className="activity-explore__header">
        <p>Activities</p>
        <h2 id="activity-explore-title">{filters.city}</h2>
      </header>
      <ActivityFilters
        filters={filters}
        cityOptions={cityOptions}
        areaOptions={areaOptions}
        weatherOptions={weatherOptions}
        onChange={onChangeFilters}
      />
      <p className="activity-explore__count">
        {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
      </p>
      {activities.length > 0 ? (
        <ul className="activity-list">
          {activities.map((activity) => (
            <li key={activity.id}>
              <ActivityCard activity={activity} onOpen={onOpenActivity} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="activity-empty surface">
          <h3>No activities match these filters.</h3>
          <button type="button" onClick={onResetFilters}>Reset filters</button>
        </div>
      )}
    </section>
  )
}
