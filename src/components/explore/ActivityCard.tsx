import type { Activity } from '../../types/trip'

export function ActivityCard({
  activity,
  onOpen,
}: {
  activity: Activity
  onOpen: (activityId: string) => void
}) {
  const locationMetadata = [activity.category, activity.area].filter(Boolean)
  const visitMetadata = [
    activity.durationMin !== null ? `${activity.durationMin} min` : null,
    activity.weather,
    activity.reservation,
  ].filter(Boolean)

  return (
    <button
      className="activity-card"
      type="button"
      aria-label={`${activity.name}, open activity details`}
      onClick={() => onOpen(activity.id)}
    >
      <span className="activity-card__heading">
        <strong>{activity.name}</strong>
        {activity.favorite ? (
          <span className="activity-card__favorite" aria-label="Favorite">🐻</span>
        ) : null}
      </span>
      {locationMetadata.length > 0 ? (
        <span className="activity-card__metadata">{locationMetadata.join(' · ')}</span>
      ) : null}
      {visitMetadata.length > 0 ? (
        <span className="activity-card__metadata">{visitMetadata.join(' · ')}</span>
      ) : null}
      {activity.about ? <span className="activity-card__about">{activity.about}</span> : null}
    </button>
  )
}
