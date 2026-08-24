import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { getTrip } from '../lib/tripData'
import { AppHeader } from './AppHeader'
import { NavigationSheet } from './NavigationSheet'

export function AppLayout() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const trip = getTrip()

  const closeNavigation = useCallback((restoreFocus: boolean) => {
    setIsNavigationOpen(false)
    if (restoreFocus) {
      menuButtonRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    if (!isNavigationOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isNavigationOpen])

  return (
    <div className="app-layout">
      <AppHeader
        isNavigationOpen={isNavigationOpen}
        menuButtonRef={menuButtonRef}
        onMenuClick={() =>
          isNavigationOpen
            ? closeNavigation(true)
            : setIsNavigationOpen(true)
        }
        tripName={trip.name}
      />
      <Outlet />
      <NavigationSheet
        isOpen={isNavigationOpen}
        onClose={closeNavigation}
      />
    </div>
  )
}
