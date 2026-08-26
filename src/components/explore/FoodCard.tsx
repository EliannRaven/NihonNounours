import type { Food } from '../../types/trip'

export function FoodCard({
  food,
  onOpen,
}: {
  food: Food
  onOpen: (foodId: string) => void
}) {
  const kindMetadata = [food.category, food.foodType].filter(Boolean)
  const detailMetadata = [food.area, food.price, food.reservation].filter(Boolean)

  return (
    <button
      className="food-card"
      type="button"
      aria-label={`${food.name}, open food details`}
      onClick={() => onOpen(food.id)}
    >
      <span className="food-card__heading">
        <strong>{food.name}</strong>
        {food.favorite ? (
          <span className="food-card__favorite" aria-label="Favorite">
            🐻
          </span>
        ) : null}
      </span>
      {kindMetadata.length > 0 ? (
        <span className="food-card__metadata">{kindMetadata.join(' · ')}</span>
      ) : null}
      {detailMetadata.length > 0 ? (
        <span className="food-card__metadata">{detailMetadata.join(' · ')}</span>
      ) : null}
      {food.about ? <span className="food-card__about">{food.about}</span> : null}
    </button>
  )
}
