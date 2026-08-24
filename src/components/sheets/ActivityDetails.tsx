import type { Activity } from '../../types/trip'
import {
  DetailSection,
  EntityHeading,
  MetadataChips,
  WebsiteAction,
} from './DetailComponents'

interface ActivityDetailsProps {
  activity: Activity
  titleId: string
}

export function ActivityDetails({ activity, titleId }: ActivityDetailsProps) {
  return (
    <article className="entity-details">
      <EntityHeading
        category="activity"
        label="Activity"
        symbol="🌿"
        title={activity.name}
        titleId={titleId}
        favorite={activity.favorite}
      />
      <MetadataChips
        values={[
          activity.category,
          activity.area,
          activity.durationMin === null
            ? null
            : `${activity.durationMin} min`,
          activity.weather,
          activity.reservation,
        ]}
      />
      <WebsiteAction href={activity.websiteLink} />
      <div className="entity-details__sections">
        <DetailSection title="About">{activity.about}</DetailSection>
        <DetailSection title="Info">{activity.info}</DetailSection>
        <DetailSection title="Important" tone="important">
          {activity.important}
        </DetailSection>
        <DetailSection title="Our Notes" tone="personal">
          {activity.ourNotes}
        </DetailSection>
      </div>
    </article>
  )
}
