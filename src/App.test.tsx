import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('redirects the root route and renders the resolved Today page', async () => {
    window.history.pushState({}, '', '/')

    render(<App />)

    expect(await screen.findByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('button', { current: 'date' })).toBeInTheDocument()
    expect(screen.getByText('Japan 2026')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/today')
  })
})
