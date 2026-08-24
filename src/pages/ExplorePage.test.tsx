import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
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

describe('ExplorePage contextual shell', () => {
  it('defaults safely to Activities without context', () => {
    renderExplore()

    expect(screen.getByRole('heading', { name: 'Explore' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Activities' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Activities' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('reflects Food URL context as lightweight indicators', () => {
    renderExplore(
      '/explore?mode=food&city=Kamakura&area=Kamakura+Station&category=Meal',
    )

    const context = screen.getByRole('region', { name: 'Food' })
    expect(within(context).getByText('Kamakura')).toBeInTheDocument()
    expect(within(context).getByText('Kamakura Station')).toBeInTheDocument()
    expect(within(context).getByText('Meal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Food' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('switches Food to Activities while preserving place and removing category', () => {
    renderExplore(
      '/explore?mode=food&city=Kamakura&area=Kamakura+Station&category=Meal',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Activities' }))

    const params = new URLSearchParams(
      screen.getByLabelText('Current search').textContent || '',
    )
    expect(params.get('mode')).toBe('activities')
    expect(params.get('city')).toBe('Kamakura')
    expect(params.get('area')).toBe('Kamakura Station')
    expect(params.has('category')).toBe(false)
    expect(screen.getByRole('heading', { name: 'Activities' })).toBeInTheDocument()
  })

  it('switches Activities to Food without inventing a category', () => {
    renderExplore('/explore?mode=activities&city=Kamakura&area=Hase')

    fireEvent.click(screen.getByRole('button', { name: 'Food' }))

    const params = new URLSearchParams(
      screen.getByLabelText('Current search').textContent || '',
    )
    expect(params.get('mode')).toBe('food')
    expect(params.get('city')).toBe('Kamakura')
    expect(params.get('area')).toBe('Hase')
    expect(params.has('category')).toBe(false)
  })

  it('handles invalid mode and blank context without errors or blank chips', () => {
    renderExplore('/explore?mode=banana&city=%20%20')

    expect(screen.getByRole('heading', { name: 'Activities' })).toBeInTheDocument()
    const context = screen.getByRole('region', { name: 'Activities' })
    expect(context.querySelectorAll('.pill')).toHaveLength(0)
  })
})
