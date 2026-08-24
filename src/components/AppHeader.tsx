import type { RefObject } from 'react'

interface AppHeaderProps {
  isNavigationOpen: boolean
  menuButtonRef: RefObject<HTMLButtonElement | null>
  onMenuClick: () => void
  tripName: string
}

export function AppHeader({
  isNavigationOpen,
  menuButtonRef,
  onMenuClick,
  tripName,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__identity">
          <span className="app-header__bear" aria-hidden="true">
            🐻
          </span>
          <span className="app-header__title">{tripName}</span>
        </div>
        <button
          ref={menuButtonRef}
          className="app-header__menu-button"
          type="button"
          aria-label={
            isNavigationOpen ? 'Close navigation' : 'Open navigation'
          }
          aria-expanded={isNavigationOpen}
          aria-controls="primary-navigation-sheet"
          onClick={onMenuClick}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}
