import type { Transport } from '../../types/trip'
import {
  DetailSection,
  EntityHeading,
  MetadataChips,
} from './DetailComponents'

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

function formatTripDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) {
    return date
  }

  const month = monthNames[Number(match[2]) - 1]
  return month ? `${month} ${Number(match[3])}` : date
}

function getTransportTitle(transport: Transport): string {
  if (transport.from && transport.to) {
    return `${transport.from} → ${transport.to}`
  }
  return transport.service || 'Transport'
}

interface TransportDetailsProps {
  transport: Transport
  titleId: string
}

export function TransportDetails({
  transport,
  titleId,
}: TransportDetailsProps) {
  return (
    <article className="entity-details">
      <EntityHeading
        category="transport"
        label="Transport"
        symbol="🚇"
        title={getTransportTitle(transport)}
        titleId={titleId}
      />
      <MetadataChips
        values={[
          transport.mode,
          transport.status,
          formatTripDate(transport.date),
          transport.startTime,
          transport.endTime,
        ]}
      />
      {transport.service ? (
        <p className="entity-details__summary">{transport.service}</p>
      ) : null}
      <div className="entity-details__sections">
        <DetailSection title="Info">{transport.info}</DetailSection>
        <DetailSection title="Important" tone="important">
          {transport.important}
        </DetailSection>
        <DetailSection title="Our Notes" tone="personal">
          {transport.ourNotes}
        </DetailSection>
      </div>
    </article>
  )
}
