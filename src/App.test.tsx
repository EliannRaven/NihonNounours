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

  it.each(['/map', '/info'])(
    'redirects the retired %s route to Today',
    async (route) => {
      window.history.pushState({}, '', route)

      render(<App />)

      expect(
        await screen.findByRole('button', { current: 'date' }),
      ).toBeInTheDocument()
      expect(window.location.pathname).toBe('/today')
    },
  )

  it('keeps unknown routes on the Not Found page', () => {
    window.history.pushState({}, '', '/not-a-real-route')

    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/not-a-real-route')
  })
})
