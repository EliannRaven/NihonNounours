import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TodayPage } from '../../pages/TodayPage'
import { TripPage } from '../../pages/TripPage'

function LocationObserver() {
  const location = useLocation()
  return <output aria-label="Current location">{location.pathname}{location.search}</output>
}

function renderTrip() {
  return render(
    <MemoryRouter initialEntries={['/trip']}>
      <Routes>
        <Route path="trip" element={<TripPage />} />
        <Route path="today" element={<TodayPage />} />
      </Routes>
      <LocationObserver />
    </MemoryRouter>,
  )
}

function getStageButton(stageOrder: number, city: string) {
  return screen.getByRole('button', {
    name: new RegExp(`Stage ${stageOrder}.*${city}`),
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-15T04:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('TripPage journey structure', () => {
  it('renders the real compact trip header and all 14 separate Stages', () => {
    renderTrip()

    expect(screen.getByRole('heading', { level: 1, name: 'Japan 2026' })).toBeInTheDocument()
    expect(screen.getByText('11 Sep – 3 Oct')).toBeInTheDocument()
    expect(screen.getByText('Day 5 of 23')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Trip progress' })).toHaveValue(5)

    const stageButtons = screen.getAllByRole('button', { name: /Stage \d+/ })
    expect(stageButtons).toHaveLength(14)
    expect(stageButtons.filter((button) => button.textContent?.includes('Tokyo'))).toHaveLength(4)
  })

  it('marks and expands real Stage 4 Kamakura on September 15', () => {
    renderTrip()

    const stage4 = getStageButton(4, 'Kamakura')
    expect(stage4).toHaveAttribute('aria-expanded', 'true')
    expect(within(stage4).getByText('Current')).toBeInTheDocument()
    expect(within(stage4).getByText('鎌倉')).toBeInTheDocument()
    expect(within(stage4).getByText('15–16 Sep · 1 night')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Day 5, Tue 15 Sep' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'plat hostel keikyu kamakura wave, open hotel details',
      }),
    ).toBeInTheDocument()
  })

  it('keeps exactly one Stage expanded when the traveller changes Stage', () => {
    renderTrip()
    const stage4 = getStageButton(4, 'Kamakura')
    const stage5 = getStageButton(5, 'Hakone')

    expect(stage4).toHaveAttribute('aria-expanded', 'true')
    expect(stage5).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(stage5)
    expect(stage4).toHaveAttribute('aria-expanded', 'false')
    expect(stage5).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps an empty generated day visible in its Stage', () => {
    renderTrip()
    fireEvent.click(getStageButton(6, 'Kyoto'))

    const day8 = screen.getByRole('link', { name: 'Day 8, Fri 18 Sep' })
    expect(day8).toBeInTheDocument()
    expect(day8).toHaveTextContent('0 plans')
  })

  it('shows registry transitions including Stage 1 arrival but no local hops or raw IDs', () => {
    renderTrip()

    const arrival = screen.getByRole('button', {
      name: 'Narrita Airport → Sendai, open transport details',
    })
    const stage1 = getStageButton(1, 'Sendai')
    expect(arrival.compareDocumentPosition(stage1)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(screen.getByRole('button', {
      name: 'Shinjuku → Kamakura, open transport details',
    })).toBeInTheDocument()
    expect(screen.queryByText('Sendai - Yamadera')).not.toBeInTheDocument()
    expect(screen.queryByText(/TRA004|Stage_Order|Booking_Link/)).not.toBeInTheDocument()
  })
})

describe('TripPage calendar defaults', () => {
  it('shows zero progress and opens Stage 1 before the trip', () => {
    vi.setSystemTime(new Date('2026-09-05T04:00:00Z'))
    renderTrip()

    expect(screen.getByText('Day 0 of 23')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Trip progress' })).toHaveValue(0)
    expect(getStageButton(1, 'Sendai')).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows full progress and opens Stage 14 after the trip', () => {
    vi.setSystemTime(new Date('2026-10-10T04:00:00Z'))
    renderTrip()

    expect(screen.getByText('Day 23 of 23')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Trip progress' })).toHaveValue(23)
    expect(getStageButton(14, 'Tokyo')).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('TripPage navigation and shared details', () => {
  it('navigates real Day 5 to the matching Today date', () => {
    renderTrip()
    fireEvent.click(screen.getByRole('link', { name: 'Day 5, Tue 15 Sep' }))

    expect(screen.getByLabelText('Current location')).toHaveTextContent(
      '/today?date=2026-09-15',
    )
    expect(screen.getByRole('heading', { name: 'Kamakura' })).toBeInTheDocument()
    expect(screen.getByText('Day 5 of 23')).toBeInTheDocument()
  })

  it('opens TRA004 in the shared Transport sheet and restores focus', () => {
    renderTrip()
    const transportButton = screen.getByRole('button', {
      name: 'Shinjuku → Kamakura, open transport details',
    })
    transportButton.focus()
    fireEvent.click(transportButton)

    expect(
      screen.getByRole('dialog', { name: 'Shinjuku → Kamakura' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }))
    expect(transportButton).toHaveFocus()
  })

  it('opens Stage 4 Hotel in the shared sanitized sheet', () => {
    renderTrip()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'plat hostel keikyu kamakura wave, open hotel details',
      }),
    )

    const dialog = screen.getByRole('dialog', {
      name: 'plat hostel keikyu kamakura wave',
    })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).queryByText(/Booking_Link|bookingLink/)).not.toBeInTheDocument()
  })
})
