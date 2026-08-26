import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExplorePage } from './ExplorePage'

function LocationObserver() {
  const location = useLocation()
  return <output aria-label="Current search">{location.search}</output>
}

function renderExplore(entry = '/explore') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="explore" element={<ExplorePage />} />
      </Routes>
      <LocationObserver />
    </MemoryRouter>,
  )
}

function currentParams() {
  return new URLSearchParams(
    screen.getByLabelText('Current search').textContent || '',
  )
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-15T04:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Explore contextual defaults', () => {
  it.each([
    ['before the trip', '2026-09-05T04:00:00Z', 'Sendai'],
    ['on September 15 in Japan', '2026-09-15T04:00:00Z', 'Kamakura'],
    ['on September 18 in Japan', '2026-09-18T04:00:00Z', 'Kyoto'],
    ['after the trip', '2026-10-10T04:00:00Z', 'Tokyo'],
  ])('chooses the trip-context city %s', (_label, now, city) => {
    vi.setSystemTime(new Date(now))
    renderExplore('/explore?mode=activities')

    expect(screen.getByRole('heading', { name: city })).toBeInTheDocument()
    expect(screen.getByLabelText('City')).toHaveValue(city)
    expect(currentParams().get('mode')).toBe('activities')
    expect(currentParams().get('city')).toBe(city)
  })

  it.each([
    ['before the trip', '2026-09-05T04:00:00Z', 'Sendai'],
    ['on September 15 in Japan', '2026-09-15T04:00:00Z', 'Kamakura'],
    ['on September 18 in Japan', '2026-09-18T04:00:00Z', 'Kyoto'],
    ['after the trip', '2026-10-10T04:00:00Z', 'Tokyo'],
  ])('chooses the Food trip-context city %s', (_label, now, city) => {
    vi.setSystemTime(new Date(now))
    renderExplore('/explore?mode=food')

    expect(screen.getByRole('heading', { name: city })).toBeInTheDocument()
    expect(screen.getByLabelText('City')).toHaveValue(city)
    expect(currentParams().get('mode')).toBe('food')
    expect(currentParams().get('city')).toBe(city)
  })
})

describe('Explore Activities real catalogue', () => {
  it('renders representative Kamakura Activities', () => {
    renderExplore('/explore?mode=activities&city=Kamakura')

    expect(screen.getByRole('button', { name: /Hasedera Temple/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sasuke Inari Shrine/ })).toBeInTheDocument()
    expect(screen.getByText(/activities$/)).toBeInTheDocument()
  })

  it('filters real Hase Activities by area', () => {
    renderExplore('/explore?mode=activities&city=Kamakura&area=Hase')

    expect(screen.getByRole('button', { name: /Hasedera Temple/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Kōtoku-in/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Sasuke Inari Shrine/ })).not.toBeInTheDocument()
  })

  it('uses authored Sunny metadata and excludes null weather', () => {
    renderExplore('/explore?mode=activities&city=Kamakura&weather=sunny')

    expect(screen.getByRole('button', { name: /Hasedera Temple/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Kōtoku-in/ })).not.toBeInTheDocument()
  })

  it('filters to authored favorites', () => {
    renderExplore('/explore?mode=activities&city=Kamakura&favorites=1')

    expect(screen.getByRole('button', { name: /Hasedera Temple/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sasuke Inari Shrine/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Kōtoku-in/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Favorites' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('shows useful Hasedera metadata without nested actions', () => {
    renderExplore('/explore?mode=activities&city=Kamakura&area=Hase')
    const card = screen.getByRole('button', { name: /Hasedera Temple/ })

    expect(within(card).getByText('Culture · Hase')).toBeInTheDocument()
    expect(within(card).getByText('75 min · Sunny')).toBeInTheDocument()
    expect(within(card).getByLabelText('Favorite')).toBeInTheDocument()
    expect(within(card).queryByRole('button')).not.toBeInTheDocument()
  })

  it('opens the shared Activity sheet and restores card focus', () => {
    renderExplore('/explore?mode=activities&city=Kamakura&area=Hase')
    const card = screen.getByRole('button', { name: /Hasedera Temple/ })
    card.focus()
    fireEvent.click(card)

    expect(screen.getByRole('dialog', { name: 'Hasedera Temple' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }))
    expect(card).toHaveFocus()
  })

  it('keeps zero-Activity trip cities selectable with a calm empty state', () => {
    renderExplore('/explore?mode=activities&city=Tokyo')

    expect(screen.getByLabelText('City')).toHaveValue('Tokyo')
    expect(
      screen.getByRole('heading', { name: 'No activities match these filters.' }),
    ).toBeInTheDocument()
    expect(screen.getByText('0 activities')).toBeInTheDocument()
  })

  it('resets filters while preserving the selected city', () => {
    renderExplore(
      '/explore?mode=activities&city=Kamakura&area=Hase&weather=sunny&time=under-1h&favorites=1',
    )
    expect(
      screen.getByRole('heading', { name: 'No activities match these filters.' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(screen.getByRole('button', { name: /Hasedera Temple/ })).toBeInTheDocument()
    expect(Object.fromEntries(currentParams())).toEqual({
      mode: 'activities',
      city: 'Kamakura',
    })
  })
})

describe('Explore Activities URL controls', () => {
  it('normalizes impossible area and invalid filters safely', () => {
    renderExplore(
      '/explore?mode=activities&city=Kamakura&area=DefinitelyNotAnArea&weather=banana&time=forever&favorites=no',
    )

    expect(screen.getByLabelText('Area')).toHaveValue('')
    expect(screen.getByLabelText('Weather')).toHaveValue('')
    expect(screen.getByLabelText('Time available')).toHaveValue('all')
    expect(screen.getByRole('button', { name: 'Favorites' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(Object.fromEntries(currentParams())).toEqual({
      mode: 'activities',
      city: 'Kamakura',
    })
  })

  it('changes city without carrying area and preserves valid filters', () => {
    renderExplore(
      '/explore?mode=activities&city=Kamakura&area=Hase&weather=sunny&favorites=1',
    )
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Hakone' } })

    expect(currentParams().get('city')).toBe('Hakone')
    expect(currentParams().has('area')).toBe(false)
    expect(currentParams().get('weather')).toBe('sunny')
    expect(currentParams().get('favorites')).toBe('1')
  })

  it('removes area, weather, time, and favorites through controls', () => {
    renderExplore(
      '/explore?mode=activities&city=Kamakura&area=Hase&weather=sunny&time=1-2h&favorites=1',
    )

    fireEvent.change(screen.getByLabelText('Area'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Weather'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Time available'), { target: { value: 'all' } })
    fireEvent.click(screen.getByRole('button', { name: 'Favorites' }))

    expect(currentParams().has('area')).toBe(false)
    expect(currentParams().has('weather')).toBe(false)
    expect(currentParams().has('time')).toBe(false)
    expect(currentParams().has('favorites')).toBe(false)
  })

  it('switches Activities to Food and clears Activity-only filters', () => {
    renderExplore(
      '/explore?mode=activities&city=Kamakura&area=Hase&weather=sunny&time=under-1h&favorites=1&future=kept',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Food' }))

    expect(currentParams().get('mode')).toBe('food')
    expect(currentParams().get('city')).toBe('Kamakura')
    expect(currentParams().get('area')).toBe('Hase')
    expect(currentParams().has('weather')).toBe(false)
    expect(currentParams().has('time')).toBe(false)
    expect(currentParams().has('favorites')).toBe(false)
    expect(currentParams().has('category')).toBe(false)
    expect(currentParams().get('future')).toBe('kept')
  })

  it('switches Food to Activities, clears category, and normalizes invalid area', () => {
    renderExplore(
      '/explore?mode=food&city=Kamakura&area=Kamakura+Station&category=Meal&favorites=1',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Activities' }))

    expect(currentParams().get('mode')).toBe('activities')
    expect(currentParams().get('city')).toBe('Kamakura')
    expect(currentParams().has('area')).toBe(false)
    expect(currentParams().has('category')).toBe(false)
    expect(currentParams().has('favorites')).toBe(false)
  })

  it('renders Today Food context as real filters and a calm empty state', () => {
    renderExplore(
      '/explore?mode=food&city=Kamakura&area=Kamakura+Station&category=Meal',
    )

    expect(screen.getByLabelText('City')).toHaveValue('Kamakura')
    expect(screen.getByLabelText('Area')).toHaveValue('Kamakura Station')
    expect(screen.getByLabelText('Category')).toHaveValue('Meal')
    expect(
      within(screen.getByLabelText('Area')).getByRole('option', {
        name: 'Kamakura Station',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'No food options match these filters.' }),
    ).toBeInTheDocument()
  })
})

describe('Explore Food real catalogue', () => {
  it('renders Kamakura Food with authored card metadata', () => {
    renderExplore('/explore?mode=food&city=Kamakura')

    const card = screen.getByRole('button', { name: /Hōkoku-ji Matcha Tea/ })
    expect(within(card).getByText('Cafe · Matcha')).toBeInTheDocument()
    expect(within(card).getByText('Jomyoji · ¥600 + temple admission')).toBeInTheDocument()
    expect(within(card).queryByLabelText('Favorite')).not.toBeInTheDocument()
  })

  it('filters real Food by area and category', () => {
    renderExplore('/explore?mode=food&city=Kamakura&area=Jomyoji&category=Cafe')

    expect(screen.getByRole('button', { name: /Hōkoku-ji Matcha Tea/ })).toBeInTheDocument()
    expect(screen.getByText('1 food option')).toBeInTheDocument()
  })

  it('filters Osaka Food to authored favorites', () => {
    renderExplore('/explore?mode=food&city=Osaka&favorites=1')

    expect(screen.getByRole('button', { name: /Eorzea Cafe Osaka/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cabbage Yaki/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Kuromon Ichiba Market/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Favorites' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('opens the shared Food sheet and restores card focus', () => {
    renderExplore('/explore?mode=food&city=Kamakura')
    const card = screen.getByRole('button', { name: /Hōkoku-ji Matcha Tea/ })
    card.focus()
    fireEvent.click(card)

    expect(screen.getByRole('dialog', { name: 'Hōkoku-ji Matcha Tea' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }))
    expect(card).toHaveFocus()
  })

  it('keeps trip cities without Food selectable', () => {
    renderExplore('/explore?mode=food&city=Hakone')

    expect(screen.getByLabelText('City')).toHaveValue('Hakone')
    expect(
      screen.getByRole('heading', { name: 'No food options match these filters.' }),
    ).toBeInTheDocument()
    expect(screen.getByText('0 food options')).toBeInTheDocument()
  })

  it('removes a contextual area through the control and reveals matching Food', () => {
    renderExplore(
      '/explore?mode=food&city=Kamakura&area=Kamakura+Station&category=Cafe',
    )
    expect(screen.queryByRole('button', { name: /Hōkoku-ji Matcha Tea/ })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Area'), { target: { value: '' } })

    expect(currentParams().has('area')).toBe(false)
    expect(currentParams().get('category')).toBe('Cafe')
    expect(screen.getByRole('button', { name: /Hōkoku-ji Matcha Tea/ })).toBeInTheDocument()
  })

  it('changes city without carrying area and preserves Food filters', () => {
    renderExplore(
      '/explore?mode=food&city=Kamakura&area=Jomyoji&category=Cafe&favorites=1',
    )
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Osaka' } })

    expect(currentParams().get('city')).toBe('Osaka')
    expect(currentParams().has('area')).toBe(false)
    expect(currentParams().get('category')).toBe('Cafe')
    expect(currentParams().get('favorites')).toBe('1')
  })

  it('normalizes invalid category and resets filters while preserving city', () => {
    renderExplore('/explore?mode=food&city=Kamakura&area=Kamakura+Station&category=Banana&favorites=1')

    expect(currentParams().has('category')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(Object.fromEntries(currentParams())).toEqual({
      mode: 'food',
      city: 'Kamakura',
    })
    expect(screen.getByRole('button', { name: /Hōkoku-ji Matcha Tea/ })).toBeInTheDocument()
  })
})
