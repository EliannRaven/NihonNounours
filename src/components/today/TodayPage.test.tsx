import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TodayPage } from '../../pages/TodayPage'

function LocationObserver() {
  const location = useLocation()
  return <output aria-label="Current location">{location.pathname}{location.search}</output>
}

function renderToday(entry = '/today?date=2026-09-15') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="today" element={<TodayPage />} />
      </Routes>
      <LocationObserver />
    </MemoryRouter>,
  )
}

function getTimelineItems() {
  return within(screen.getByRole('heading', { name: 'Timeline' }).closest('section') as HTMLElement)
    .getAllByRole('listitem')
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-08-24T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('TodayPage date selection', () => {
  it('resolves September 15 as Day 5 in Kamakura', () => {
    renderToday()

    expect(screen.getByRole('heading', { name: 'Kamakura' })).toBeInTheDocument()
    expect(screen.getByText('鎌倉')).toBeInTheDocument()
    expect(screen.getByText('Tuesday, 15 September')).toBeInTheDocument()
    expect(screen.getByText('Day 5 of 23')).toBeInTheDocument()
  })

  it('renders all 23 trip dates and marks September 15 current', () => {
    renderToday()

    const navigator = screen.getByRole('navigation', { name: 'Trip dates' })
    expect(within(navigator).getAllByRole('button')).toHaveLength(23)
    expect(
      within(navigator).getByRole('button', {
        name: 'Tuesday, 15 September, Day 5',
      }),
    ).toHaveAttribute('aria-current', 'date')
  })

  it('selects September 16, renders Hakone, and updates the URL', () => {
    renderToday('/today?date=2026-09-15&view=compact')

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Wednesday, 16 September, Day 6',
      }),
    )

    expect(screen.getByRole('heading', { name: 'Hakone' })).toBeInTheDocument()
    expect(screen.getByText('Day 6 of 23')).toBeInTheDocument()
    expect(screen.getByLabelText('Current location')).toHaveTextContent(
      '/today?date=2026-09-16&view=compact',
    )
  })

  it('falls back safely from an invalid URL date', () => {
    renderToday('/today?date=2026-10-04')

    expect(screen.getByRole('button', { current: 'date' })).toBeInTheDocument()
    expect(screen.getByText(/Day \d+ of 23/)).toBeInTheDocument()
    expect(screen.queryByText('2026-10-04')).not.toBeInTheDocument()
  })
})

describe('TodayPage timeline', () => {
  it('keeps the generated September 15 order', () => {
    renderToday()

    const items = getTimelineItems()
    const expectedTitles = [
      'Shinjuku → Kamakura',
      'Lunch',
      'Hasedera Temple',
      'Kōtoku-in – Great Buddha',
      'Kamakura Kōkō Mae Station',
      'Shichirigahama Beach',
      'plat hostel keikyu kamakura wave',
    ]

    expectedTitles.forEach((title, index) => {
      expect(items[index]).toHaveTextContent(title)
    })
  })

  it('shows authored Activity timing, duration, and favorite metadata', () => {
    renderToday()

    const activityButton = screen.getByRole('button', { name: /Hasedera Temple/ })
    expect(within(activityButton).getByText('12:30')).toBeInTheDocument()
    expect(within(activityButton).getByText('75 min')).toBeInTheDocument()
    expect(within(activityButton).getByLabelText('Favorite')).toBeInTheDocument()
  })

  it('opens Activity details and restores focus when closed', () => {
    renderToday()
    const activityButton = screen.getByRole('button', { name: /Hasedera Temple/ })
    activityButton.focus()

    fireEvent.click(activityButton)
    expect(screen.getByRole('dialog', { name: 'Hasedera Temple' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close details' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(activityButton).toHaveFocus()
  })

  it('opens Transport details from TRA004', () => {
    renderToday()

    fireEvent.click(screen.getByRole('button', { name: /Shinjuku → Kamakura/ }))

    expect(
      screen.getByRole('dialog', { name: 'Shinjuku → Kamakura' }),
    ).toBeInTheDocument()
    expect(screen.getByText('JR Shonan-Shinjuku Line direct → Kamakura (destination Zushi / 逗子)')).toBeInTheDocument()
  })

  it('opens Stage 4 Hotel details', () => {
    renderToday()

    fireEvent.click(
      screen.getByRole('button', { name: /plat hostel keikyu kamakura wave/ }),
    )

    expect(
      screen.getByRole('dialog', { name: 'plat hostel keikyu kamakura wave' }),
    ).toBeInTheDocument()
  })

  it('renders flexible Food without a reference as a non-interactive item', () => {
    renderToday()
    const lunch = screen.getByText('Lunch').closest('article')

    expect(lunch).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Lunch/ })).not.toBeInTheDocument()
    expect(within(lunch as HTMLElement).getByText('Flexible')).toBeInTheDocument()
  })

  it('renders local Transport without a reference as a non-interactive item', () => {
    renderToday('/today?date=2026-09-12')
    const localTransport = getTimelineItems().find((item) => {
      const article = item.querySelector('article')
      return article?.textContent?.includes('Transport')
    })

    expect(localTransport?.querySelector('article')).toBeInTheDocument()
    expect(localTransport?.querySelector('button')).not.toBeInTheDocument()
  })

  it('renders a calm state for an empty selectable day', () => {
    renderToday('/today?date=2026-09-18')

    expect(screen.getByRole('heading', { name: 'Nothing planned yet.' })).toBeInTheDocument()
    expect(screen.getByText('Explore the city or keep the day flexible.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Friday, 18 September, Day 8' }),
    ).toHaveAttribute('aria-current', 'date')
  })
})

describe('TodayPage temporal awareness', () => {
  it('shows NOW only while viewing the actual current Japan date', () => {
    vi.setSystemTime(new Date('2026-09-15T04:30:00Z'))
    const { unmount } = renderToday('/today?date=2026-09-15')

    expect(screen.getByLabelText('Current time, 13:30')).toBeInTheDocument()

    unmount()
    renderToday('/today?date=2026-09-14')
    expect(screen.queryByLabelText(/Current time/)).not.toBeInTheDocument()
  })

  it('does not add temporal UI to a future viewed date', () => {
    vi.setSystemTime(new Date('2026-09-15T04:30:00Z'))
    renderToday('/today?date=2026-09-16')

    expect(screen.queryByLabelText(/Current time/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Earlier today/ })).not.toBeInTheDocument()
    expect(screen.getByText('Sasuke Inari Shrine')).toBeInTheDocument()
  })

  it('collapses the real leading September 15 items by default', () => {
    vi.setSystemTime(new Date('2026-09-15T04:30:00Z'))
    renderToday()

    const toggle = screen.getByRole('button', { name: 'Earlier today · 2 items' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Lunch')).not.toBeInTheDocument()
    expect(screen.getByText(/Hasedera Temple/)).toBeInTheDocument()
  })

  it('expands earlier items in authored order', () => {
    vi.setSystemTime(new Date('2026-09-15T04:30:00Z'))
    renderToday()
    const toggle = screen.getByRole('button', { name: 'Earlier today · 2 items' })

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const earlierList = screen.getByText('Lunch').closest('ol') as HTMLElement
    const earlierItems = within(earlierList).getAllByRole('listitem')
    expect(earlierItems[0]).toHaveTextContent('Shinjuku → Kamakura')
    expect(earlierItems[1]).toHaveTextContent('Lunch')
  })

  it('keeps an earlier entity interactive and restores its focus', () => {
    vi.setSystemTime(new Date('2026-09-15T04:30:00Z'))
    renderToday()
    fireEvent.click(screen.getByRole('button', { name: /Earlier today/ }))
    const transportButton = screen.getByRole('button', {
      name: /Shinjuku → Kamakura/,
    })
    transportButton.focus()

    fireEvent.click(transportButton)
    expect(
      screen.getByRole('dialog', { name: 'Shinjuku → Kamakura' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close details' }))
    expect(transportButton).toHaveFocus()
  })

  it('places NOW after an active item and before the next future item', () => {
    vi.setSystemTime(new Date('2026-09-15T04:30:00Z'))
    renderToday()
    const now = screen.getByLabelText('Current time, 13:30')
    const hasedera = screen.getByText(/Hasedera Temple/).closest('li') as HTMLElement
    const kotoku = screen.getByText('Kōtoku-in – Great Buddha').closest('li') as HTMLElement

    expect(hasedera.compareDocumentPosition(now)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(now.compareDocumentPosition(kotoku)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('places NOW after the remaining timeline late in the day', () => {
    vi.setSystemTime(new Date('2026-09-15T14:30:00Z'))
    renderToday()
    const now = screen.getByLabelText('Current time, 23:30')
    const hotel = screen
      .getByText('plat hostel keikyu kamakura wave')
      .closest('li') as HTMLElement

    expect(hotel.compareDocumentPosition(now)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })
})
