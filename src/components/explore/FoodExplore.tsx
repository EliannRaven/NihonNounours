import type { FoodExploreFilters } from '../../lib/foodExplore'
import type { Food } from '../../types/trip'
import { FoodCard } from './FoodCard'
import { FoodFilters } from './FoodFilters'

export function FoodExplore({
  filters,
  cityOptions,
  areaOptions,
  categoryOptions,
  food,
  onChangeFilters,
  onResetFilters,
  onOpenFood,
}: {
  filters: FoodExploreFilters
  cityOptions: readonly string[]
  areaOptions: readonly string[]
  categoryOptions: readonly string[]
  food: readonly Food[]
  onChangeFilters: (changes: Partial<FoodExploreFilters>) => void
  onResetFilters: () => void
  onOpenFood: (foodId: string) => void
}) {
  return (
    <section className="food-explore" aria-labelledby="food-explore-title">
      <header className="food-explore__header">
        <p>Food</p>
        <h2 id="food-explore-title">{filters.city}</h2>
      </header>
      <FoodFilters
        filters={filters}
        cityOptions={cityOptions}
        areaOptions={areaOptions}
        categoryOptions={categoryOptions}
        onChange={onChangeFilters}
      />
      <p className="food-explore__count">
        {food.length} {food.length === 1 ? 'food option' : 'food options'}
      </p>
      {food.length > 0 ? (
        <ul className="food-list">
          {food.map((item) => (
            <li key={item.id}>
              <FoodCard food={item} onOpen={onOpenFood} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="food-empty surface">
          <h3>No food options match these filters.</h3>
          <button type="button" onClick={onResetFilters}>
            Reset filters
          </button>
        </div>
      )}
    </section>
  )
}
