import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BottomSheet } from './BottomSheet'
import {
  EntityBottomSheet,
  type EntitySheetSelection,
} from './EntityBottomSheet'

function BottomSheetHarness() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open details
      </button>
      <BottomSheet
        isOpen={isOpen}
        titleId="test-sheet-title"
        onClose={() => setIsOpen(false)}
      >
        <h2 id="test-sheet-title">Test details</h2>
        <a href="https://example.com">Final action</a>
      </BottomSheet>
    </>
  )
}

function openGenericSheet() {
  const trigger = screen.getByRole('button', { name: 'Open details' })
  trigger.focus()
  fireEvent.click(trigger)
  return {
    dialog: screen.getByRole('dialog', { name: 'Test details' }),
    trigger,
  }
}

describe('BottomSheet', () => {
  it('renders no accessible dialog while closed', () => {
    render(<BottomSheetHarness />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders an accessible modal dialog while open', () => {
    render(<BottomSheetHarness />)

    const { dialog } = openGenericSheet()

    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('moves initial focus to the close button', () => {
    render(<BottomSheetHarness />)
    openGenericSheet()

    expect(screen.getByRole('button', { name: 'Close details' })).toHaveFocus()
  })

  it('keeps the backdrop out of the keyboard tab order', () => {
    render(<BottomSheetHarness />)
    openGenericSheet()

    expect(
      screen.getByRole('button', { name: 'Close details backdrop' }),
    ).toHaveAttribute('tabindex', '-1')
  })

  it('wraps Tab from the final action to the close button', () => {
    render(<BottomSheetHarness />)
    const { dialog } = openGenericSheet()
    within(dialog).getByRole('link', { name: 'Final action' }).focus()

    fireEvent.keyDown(document, { key: 'Tab' })

    expect(
      within(dialog).getByRole('button', { name: 'Close details' }),
    ).toHaveFocus()
  })

  it('wraps Shift+Tab from the close button to the final action', () => {
    render(<BottomSheetHarness />)
    const { dialog } = openGenericSheet()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })

    expect(within(dialog).getByRole('link', { name: 'Final action' })).toHaveFocus()
  })

  it('closes with Escape and restores trigger focus', () => {
    render(<BottomSheetHarness />)
    const { trigger } = openGenericSheet()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes from its close button and restores trigger focus', () => {
    render(<BottomSheetHarness />)
    const { trigger } = openGenericSheet()

    fireEvent.click(screen.getByRole('button', { name: 'Close details' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes from a pointer backdrop click and restores trigger focus', () => {
    render(<BottomSheetHarness />)
    const { trigger } = openGenericSheet()

    fireEvent.click(
      screen.getByRole('button', { name: 'Close details backdrop' }),
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('locks body scrolling while open and restores it after closing', () => {
    document.body.style.overflow = 'scroll'
    render(<BottomSheetHarness />)
    openGenericSheet()

    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.click(screen.getByRole('button', { name: 'Close details' }))

    expect(document.body.style.overflow).toBe('scroll')
  })
})

function renderEntity(selection: EntitySheetSelection | null) {
  const onClose = vi.fn()
  const result = render(
    <EntityBottomSheet selection={selection} onClose={onClose} />,
  )
  return { ...result, onClose }
}

describe('EntityBottomSheet selection', () => {
  it('stays closed for a null selection', () => {
    renderEntity(null)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders representative Activity details from selectors', () => {
    renderEntity({ kind: 'activity', id: 'ACT015' })

    const dialog = screen.getByRole('dialog', { name: 'Hasedera Temple' })
    expect(within(dialog).getByText('Hase')).toBeInTheDocument()
    expect(within(dialog).getByText('75 min')).toBeInTheDocument()
    expect(within(dialog).getByText(/Favorite/)).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: 'About' })).toBeInTheDocument()
  })

  it('does not render an empty Activity section', () => {
    renderEntity({ kind: 'activity', id: 'ACT001' })

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByRole('heading', { name: 'Info' })).not.toBeInTheDocument()
  })

  it('renders Activity website actions with safe external-link attributes', () => {
    renderEntity({ kind: 'activity', id: 'ACT015' })

    const link = screen.getByRole('link', { name: /Website/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('renders representative Food details from selectors', () => {
    renderEntity({ kind: 'food', id: 'FOD003' })

    const dialog = screen.getByRole('dialog', { name: /Matcha Tea/ })
    expect(within(dialog).getByText('Matcha')).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: 'About' })).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: 'Info' })).toBeInTheDocument()
  })

  it('renders favorite Food metadata from selectors', () => {
    renderEntity({ kind: 'food', id: 'FOD009' })

    const dialog = screen.getByRole('dialog', { name: 'Eorzea Cafe Osaka' })
    expect(within(dialog).getByText(/Favorite/)).toBeInTheDocument()
    expect(within(dialog).getByText('Required')).toBeInTheDocument()
  })

  it('renders Food website actions safely', () => {
    renderEntity({ kind: 'food', id: 'FOD003' })

    const link = screen.getByRole('link', { name: /Website/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('renders operational Transport details by registry ID', () => {
    renderEntity({ kind: 'transport', id: 'TRA004' })

    const dialog = screen.getByRole('dialog', {
      name: 'Shinjuku → Kamakura',
    })
    expect(within(dialog).getByText('Train')).toBeInTheDocument()
    expect(within(dialog).getByText('Planned')).toBeInTheDocument()
    expect(within(dialog).getByText('Sep 15')).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: 'Info' })).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: 'Important' })).toBeInTheDocument()
    expect(within(dialog).queryByText('Stage 4')).not.toBeInTheDocument()
  })

  it('renders Hotel details for a stage without booking data', () => {
    const { container } = renderEntity({ kind: 'hotel', stageOrder: 4 })

    const dialog = screen.getByRole('dialog', {
      name: 'plat hostel keikyu kamakura wave',
    })
    expect(within(dialog).getByText('Check-in 16:00')).toBeInTheDocument()
    expect(within(dialog).getByText('Check-out 11:00')).toBeInTheDocument()
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Booking_Link|bookingLink|auth_key/)
  })

  it.each([
    { kind: 'activity', id: 'ACT999' } as const,
    { kind: 'food', id: 'FOD999' } as const,
    { kind: 'transport', id: 'TRA999' } as const,
    { kind: 'hotel', stageOrder: 999 } as const,
  ])('ignores an unknown $kind selection without crashing', (selection) => {
    renderEntity(selection)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
