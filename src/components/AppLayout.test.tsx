import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppLayout } from './AppLayout'

const routeHeadings = [
  { path: '/today', heading: 'Today' },
  { path: '/trip', heading: 'Trip' },
  { path: '/explore', heading: 'Explore' },
]

function renderLayout(initialEntry = '/today') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<AppLayout />}>
          {routeHeadings.map(({ path, heading }) => (
            <Route key={path} path={path} element={<h1>{heading}</h1>} />
          ))}
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function openNavigation() {
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }))
  return screen.getByRole('dialog', { name: 'Navigation' })
}

describe('AppLayout header', () => {
  it('renders the persistent application header', () => {
    renderLayout()

    expect(screen.getByRole('banner')).toHaveClass('app-header')
  })

  it('displays the generated trip name', () => {
    renderLayout()

    expect(screen.getByText('Japan 2026')).toBeInTheDocument()
  })

  it('provides an accessible hamburger button', () => {
    renderLayout()

    const button = screen.getByRole('button', { name: 'Open navigation' })
    expect(button).toHaveAttribute('aria-controls', 'primary-navigation-sheet')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('NavigationSheet', () => {
  it('is initially closed', () => {
    renderLayout()

    expect(
      screen.queryByRole('dialog', { name: 'Navigation' }),
    ).not.toBeInTheDocument()
  })

  it('opens from the hamburger button', () => {
    renderLayout()

    const dialog = openNavigation()

    expect(dialog).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Close navigation' }),
    ).toHaveAttribute('aria-expanded', 'true')
  })

  it('moves focus to the close control when opened', () => {
    renderLayout()

    openNavigation()

    expect(
      screen.getByRole('button', { name: 'Close navigation sheet' }),
    ).toHaveFocus()
  })

  it('keeps the backdrop out of the normal tab order', () => {
    renderLayout()
    openNavigation()

    expect(
      screen.getByRole('button', { name: 'Close navigation backdrop' }),
    ).toHaveAttribute('tabindex', '-1')
  })

  it('wraps Tab from Explore to the close control', () => {
    renderLayout()
    const dialog = openNavigation()
    const lastLink = within(dialog).getByRole('link', { name: 'Explore' })

    lastLink.focus()
    fireEvent.keyDown(document, { key: 'Tab' })

    expect(
      within(dialog).getByRole('button', { name: 'Close navigation sheet' }),
    ).toHaveFocus()
  })

  it('wraps Shift+Tab from the close control to Explore', () => {
    renderLayout()
    const dialog = openNavigation()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })

    expect(within(dialog).getByRole('link', { name: 'Explore' })).toHaveFocus()
  })

  it('returns focus to the dialog if it reaches the hamburger while open', () => {
    renderLayout()
    const menuButton = screen.getByRole('button', { name: 'Open navigation' })
    const dialog = openNavigation()

    menuButton.focus()
    fireEvent.keyDown(document, { key: 'Tab' })

    expect(
      within(dialog).getByRole('button', { name: 'Close navigation sheet' }),
    ).toHaveFocus()
  })

  it('exposes exactly the three MVP destinations', () => {
    renderLayout()

    const dialog = openNavigation()
    const navigation = within(dialog).getByRole('navigation', {
      name: 'Primary navigation',
    })

    expect(within(navigation).getAllByRole('link')).toHaveLength(3)
    expect(within(navigation).getAllByRole('link').map((link) => link.textContent))
      .toEqual(['Today', 'Trip', 'Explore'])
    expect(
      within(navigation).queryByRole('link', { name: 'Map' }),
    ).not.toBeInTheDocument()
    expect(
      within(navigation).queryByRole('link', { name: 'Trip Info' }),
    ).not.toBeInTheDocument()
  })

  it.each([
    ['Today', '/today'],
    ['Trip', '/trip'],
    ['Explore', '/explore'],
  ])('%s points to %s', (label, route) => {
    renderLayout()

    const dialog = openNavigation()

    expect(within(dialog).getByRole('link', { name: label })).toHaveAttribute(
      'href',
      route,
    )
  })

  it('marks the current route with active semantics', () => {
    renderLayout('/today')

    const dialog = openNavigation()

    expect(within(dialog).getByRole('link', { name: 'Today' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(dialog).getByRole('link', { name: 'Trip' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('navigates to Trip when selected', () => {
    renderLayout()
    const dialog = openNavigation()

    fireEvent.click(within(dialog).getByRole('link', { name: 'Trip' }))

    expect(screen.getByRole('heading', { name: 'Trip' })).toBeInTheDocument()
  })

  it('closes after selecting Trip', () => {
    renderLayout()
    const dialog = openNavigation()

    fireEvent.click(within(dialog).getByRole('link', { name: 'Trip' }))

    expect(
      screen.queryByRole('dialog', { name: 'Navigation' }),
    ).not.toBeInTheDocument()
  })

  it('closes with Escape and restores hamburger focus', () => {
    renderLayout()
    const menuButton = screen.getByRole('button', { name: 'Open navigation' })
    openNavigation()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(
      screen.queryByRole('dialog', { name: 'Navigation' }),
    ).not.toBeInTheDocument()
    expect(menuButton).toHaveFocus()
  })

  it('closes from the explicit close control', () => {
    renderLayout()
    const menuButton = screen.getByRole('button', { name: 'Open navigation' })
    openNavigation()

    fireEvent.click(
      screen.getByRole('button', { name: 'Close navigation sheet' }),
    )

    expect(
      screen.queryByRole('dialog', { name: 'Navigation' }),
    ).not.toBeInTheDocument()
    expect(menuButton).toHaveFocus()
  })

  it('closes when the backdrop is pressed', () => {
    renderLayout()
    openNavigation()

    fireEvent.click(
      screen.getByRole('button', { name: 'Close navigation backdrop' }),
    )

    expect(
      screen.queryByRole('dialog', { name: 'Navigation' }),
    ).not.toBeInTheDocument()
  })

  it('locks and restores body scrolling', () => {
    renderLayout()
    openNavigation()

    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(document.body.style.overflow).toBe('')
  })
})
