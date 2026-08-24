import type { ReactNode } from 'react'

interface EntityHeadingProps {
  category: 'activity' | 'food' | 'transport' | 'hotel'
  label: string
  symbol: string
  title: string
  titleId: string
  favorite?: boolean
}

export function EntityHeading({
  category,
  label,
  symbol,
  title,
  titleId,
  favorite = false,
}: EntityHeadingProps) {
  return (
    <header className="entity-details__header">
      <span className={`entity-details__type is-${category}`}>
        <span aria-hidden="true">{symbol}</span> {label}
      </span>
      <h2 id={titleId} className="entity-details__title">
        {title}
      </h2>
      {favorite ? (
        <span className="entity-details__favorite">
          <span aria-hidden="true">🐻</span> Favorite
        </span>
      ) : null}
    </header>
  )
}

export function MetadataChips({ values }: { values: readonly unknown[] }) {
  const visibleValues = values.filter(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0,
  )

  if (visibleValues.length === 0) {
    return null
  }

  return (
    <div className="entity-details__metadata" aria-label="Details">
      {visibleValues.map((value) => (
        <span key={value} className="entity-details__chip">
          {value}
        </span>
      ))}
    </div>
  )
}

interface DetailSectionProps {
  title: string
  children: ReactNode
  tone?: 'default' | 'important' | 'personal'
}

export function DetailSection({
  title,
  children,
  tone = 'default',
}: DetailSectionProps) {
  if (
    children === null ||
    children === undefined ||
    (typeof children === 'string' && children.trim().length === 0)
  ) {
    return null
  }

  return (
    <section className={`entity-details__section is-${tone}`}>
      <h3>{title}</h3>
      <div className="entity-details__section-content">{children}</div>
    </section>
  )
}

export function WebsiteAction({ href }: { href: string | null }) {
  if (!href) {
    return null
  }

  return (
    <div className="entity-details__actions">
      <a href={href} target="_blank" rel="noopener noreferrer">
        Website <span aria-hidden="true">↗</span>
      </a>
    </div>
  )
}
