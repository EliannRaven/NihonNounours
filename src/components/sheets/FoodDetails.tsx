import type { Food } from '../../types/trip'
import {
  DetailSection,
  EntityHeading,
  MetadataChips,
  WebsiteAction,
} from './DetailComponents'

interface FoodDetailsProps {
  food: Food
  titleId: string
}

export function FoodDetails({ food, titleId }: FoodDetailsProps) {
  return (
    <article className="entity-details">
      <EntityHeading
        category="food"
        label="Food"
        symbol="🍜"
        title={food.name}
        titleId={titleId}
        favorite={food.favorite}
      />
      <MetadataChips
        values={[
          food.area,
          food.foodType,
          food.category,
          food.price,
          food.reservation,
        ]}
      />
      <WebsiteAction href={food.websiteLink} />
      <div className="entity-details__sections">
        <DetailSection title="About">{food.about}</DetailSection>
        <DetailSection title="Info">{food.info}</DetailSection>
        <DetailSection title="Important" tone="important">
          {food.important}
        </DetailSection>
        <DetailSection title="Our Notes" tone="personal">
          {food.ourNotes}
        </DetailSection>
      </div>
    </article>
  )
}
