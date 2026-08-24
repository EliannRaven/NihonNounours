import type {
  ActivityExploreFilters,
  ActivityTimeFilter,
  ActivityWeatherOption,
} from '../../lib/activityExplore'

export function ActivityFilters({
  filters,
  cityOptions,
  areaOptions,
  weatherOptions,
  onChange,
}: {
  filters: ActivityExploreFilters
  cityOptions: readonly string[]
  areaOptions: readonly string[]
  weatherOptions: readonly ActivityWeatherOption[]
  onChange: (changes: Partial<ActivityExploreFilters>) => void
}) {
  return (
    <fieldset className="activity-filters">
      <legend className="visually-hidden">Activity filters</legend>
      <label className="activity-filter activity-filter--wide">
        <span>City</span>
        <select
          value={filters.city}
          onChange={(event) => onChange({ city: event.target.value })}
        >
          {cityOptions.map((city) => <option key={city}>{city}</option>)}
        </select>
      </label>
      <label className="activity-filter activity-filter--wide">
        <span>Area</span>
        <select
          value={filters.area ?? ''}
          onChange={(event) => onChange({ area: event.target.value || null })}
        >
          <option value="">All areas</option>
          {areaOptions.map((area) => <option key={area}>{area}</option>)}
        </select>
      </label>
      <label className="activity-filter">
        <span>Weather</span>
        <select
          value={filters.weather ?? ''}
          onChange={(event) => onChange({ weather: event.target.value || null })}
        >
          <option value="">All weather</option>
          {weatherOptions.map((option) => (
            <option key={option.key} value={option.key}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="activity-filter">
        <span>Time available</span>
        <select
          value={filters.time}
          onChange={(event) =>
            onChange({ time: event.target.value as ActivityTimeFilter })
          }
        >
          <option value="all">Any duration</option>
          <option value="under-1h">&lt; 1h</option>
          <option value="1-2h">1–2h</option>
          <option value="half-day">Half day</option>
        </select>
      </label>
      <button
        className="activity-filters__favorites"
        type="button"
        aria-pressed={filters.favorites}
        onClick={() => onChange({ favorites: !filters.favorites })}
      >
        <span aria-hidden="true">🐻</span>
        Favorites
      </button>
    </fieldset>
  )
}
