import type { Transport } from '../../types/trip'

function getTransportTitle(transport: Transport) {
  if (transport.from && transport.to) return `${transport.from} → ${transport.to}`
  return transport.service || 'Transport'
}

export function StageTransport({
  transport,
  onOpen,
}: {
  transport: Transport
  onOpen: (transportId: string) => void
}) {
  const title = getTransportTitle(transport)

  return (
    <div className="stage-transport">
      <span className="stage-transport__line" aria-hidden="true" />
      <button
        className="stage-transport__button"
        type="button"
        aria-label={`${title}, open transport details`}
        onClick={() => onOpen(transport.id)}
      >
        <span className="stage-transport__kind">Transport</span>
        <strong>{title}</strong>
        <span className="stage-transport__meta">
          {[transport.mode, transport.status].filter(Boolean).join(' · ')}
        </span>
        {transport.service ? (
          <span className="stage-transport__service">{transport.service}</span>
        ) : null}
      </button>
    </div>
  )
}
