import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('redirects the root route and renders Today', async () => {
    window.history.pushState({}, '', '/')

    render(<App />)

    expect(
      await screen.findByRole('heading', { name: 'Today' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/today')
  })
})
