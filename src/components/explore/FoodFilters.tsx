import type { FoodExploreFilters } from '../../lib/foodExplore'

export function FoodFilters({
  filters,
  cityOptions,
  areaOptions,
  categoryOptions,
  onChange,
}: {
  filters: FoodExploreFilters
  cityOptions: readonly string[]
  areaOptions: readonly string[]
  categoryOptions: readonly string[]
  onChange: (changes: Partial<FoodExploreFilters>) => void
}) {
  return (
    <fieldset className="food-filters">
      <legend className="visually-hidden">Food filters</legend>
      <label className="food-filter">
        <span>City</span>
        <select
          value={filters.city}
          onChange={(event) => onChange({ city: event.target.value })}
        >
          {cityOptions.map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>
      </label>
      <label className="food-filter">
        <span>Area</span>
        <select
          value={filters.area ?? ''}
          onChange={(event) => onChange({ area: event.target.value || null })}
        >
          <option value="">All areas</option>
          {areaOptions.map((area) => (
            <option key={area}>{area}</option>
          ))}
        </select>
      </label>
      <label className="food-filter">
        <span>Category</span>
        <select
          value={filters.category ?? ''}
          onChange={(event) => onChange({ category: event.target.value || null })}
        >
          <option value="">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </label>
      <button
        className="food-filters__favorites"
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
