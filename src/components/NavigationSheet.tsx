import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'

interface NavigationSheetProps {
  isOpen: boolean
  onClose: (restoreFocus: boolean) => void
}

const destinations = [
  { label: 'Today', to: '/today' },
  { label: 'Trip', to: '/trip' },
  { label: 'Explore', to: '/explore' },
  { label: 'Map', to: '/map' },
  { label: 'Trip Info', to: '/info' },
] as const

export function NavigationSheet({
  isOpen,
  onClose,
}: NavigationSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <div
      className={`navigation-layer${isOpen ? ' is-open' : ''}`}
      aria-hidden={!isOpen}
    >
      <button
        className="navigation-layer__backdrop"
        type="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label="Close navigation backdrop"
        onClick={() => onClose(true)}
      />
      <section
        id="primary-navigation-sheet"
        className="navigation-sheet"
        role="dialog"
        aria-modal={isOpen ? 'true' : undefined}
        aria-labelledby="navigation-sheet-title"
        inert={!isOpen}
      >
        <div className="navigation-sheet__handle" aria-hidden="true" />
        <div className="navigation-sheet__header">
          <h2 id="navigation-sheet-title" className="navigation-sheet__title">
            Navigation
          </h2>
          <button
            ref={closeButtonRef}
            className="navigation-sheet__close"
            type="button"
            tabIndex={isOpen ? 0 : -1}
            aria-label="Close navigation sheet"
            onClick={() => onClose(true)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <nav className="navigation-sheet__nav" aria-label="Primary navigation">
          {destinations.map(({ label, to }) => (
            <NavLink
              key={to}
              className="navigation-sheet__link"
              to={to}
              onClick={() => onClose(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </section>
    </div>
  )
}
