import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TopNav } from '../components/opportunities/TopNav.jsx'
import {
  createAuthValue,
  mockJsonResponse,
  renderWithProviders,
} from './test-utils.jsx'

function renderTopNav(authValue = createAuthValue()) {
  return renderWithProviders(
    <Routes>
      <Route path="/opportunities" element={<TopNav />} />
      <Route path="/profile" element={<div>Profile destination</div>} />
      <Route path="/login" element={<div>Login destination</div>} />
    </Routes>,
    {
      route: '/opportunities',
      authValue,
    },
  )
}

describe('TopNav', () => {
  it('opens the profile menu and logs out', async () => {
    const user = userEvent.setup()
    const logout = vi.fn()

    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        const href = String(url)

        if (href.includes('/api/notifications')) {
          return mockJsonResponse({ items: [], unreadCount: 0 })
        }

        throw new Error(`Unhandled fetch URL: ${href}`)
      }),
    )

    renderTopNav(
      createAuthValue({
        user: {
          id: 'user-1',
          email: 'student@umass.edu',
          emailVerified: true,
        },
        isAuthenticated: true,
        logout,
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))

    expect(screen.getByRole('menuitem', { name: 'View profile' })).toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: 'Log out' }))

    expect(logout).toHaveBeenCalledOnce()
    expect(screen.getByText('Login destination')).toBeInTheDocument()
  })
})
