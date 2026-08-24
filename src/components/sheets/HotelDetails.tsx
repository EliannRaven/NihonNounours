import type { Hotel } from '../../types/trip'
import {
  DetailSection,
  EntityHeading,
  MetadataChips,
} from './DetailComponents'

interface HotelDetailsProps {
  hotel: Hotel
  titleId: string
}

export function HotelDetails({ hotel, titleId }: HotelDetailsProps) {
  return (
    <article className="entity-details">
      <EntityHeading
        category="hotel"
        label="Hotel"
        symbol="🏨"
        title={hotel.name}
        titleId={titleId}
      />
      <MetadataChips
        values={[
          hotel.checkinTime ? `Check-in ${hotel.checkinTime}` : null,
          hotel.checkoutTime ? `Check-out ${hotel.checkoutTime}` : null,
        ]}
      />
      <div className="entity-details__sections">
        <DetailSection title="Address">{hotel.address}</DetailSection>
        <DetailSection title="Info">{hotel.info}</DetailSection>
        <DetailSection title="Important" tone="important">
          {hotel.important}
        </DetailSection>
        <DetailSection title="Our Notes" tone="personal">
          {hotel.ourNotes}
        </DetailSection>
      </div>
    </article>
  )
}
