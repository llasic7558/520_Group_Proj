import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import VerifyEmailPage from '../pages/VerifyEmailPage/VerifyEmailPage.jsx'
import {
  createAuthValue,
  mockJsonResponse,
  renderWithProviders,
} from './test-utils.jsx'

function renderVerifyEmailPage({ route = '/verify-email', authValue } = {}) {
  return renderWithProviders(
    <Routes>
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route
        path="/opportunities"
        element={<div>Opportunities destination</div>}
      />
      <Route path="/profile" element={<div>Profile destination</div>} />
      <Route path="/signup" element={<div>Signup destination</div>} />
    </Routes>,
    {
      route,
      authValue: authValue ?? createAuthValue(),
    },
  )
}

describe('VerifyEmailPage', () => {
  it('shows a top-left back link to the page that sent the user here', async () => {
    const user = userEvent.setup()

    renderVerifyEmailPage({
      route: {
        pathname: '/verify-email',
        state: { returnTo: '/profile' },
      },
      authValue: createAuthValue({
        user: {
          id: 'user-1',
          email: 'student@umass.edu',
          emailVerified: false,
        },
        isAuthenticated: true,
      }),
    })

    await user.click(screen.getByRole('link', { name: '← Back to profile' }))

    expect(screen.getByText('Profile destination')).toBeInTheDocument()
  })

  it('fills a token from the URL and verifies after submit', async () => {
    const user = userEvent.setup()
    const updateUser = vi.fn()
    const verifiedUser = {
      id: 'user-1',
      email: 'student@umass.edu',
      emailVerified: true,
    }

    vi.stubGlobal(
      'fetch',
      vi.fn((url, init) => {
        expect(String(url)).toContain('/api/auth/verify-email')
        expect(init.method).toBe('POST')
        expect(JSON.parse(init.body)).toEqual({ token: 'url-token-1' })
        return mockJsonResponse({ user: verifiedUser })
      }),
    )

    renderVerifyEmailPage({
      route: '/verify-email?token=url-token-1',
      authValue: createAuthValue({
        user: { ...verifiedUser, emailVerified: false },
        updateUser,
      }),
    })

    expect(screen.getByLabelText('Verification token')).toHaveValue(
      'url-token-1',
    )
    expect(fetch).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(
      await screen.findByText('Email verified. Redirecting…'),
    ).toBeInTheDocument()
    expect(updateUser).toHaveBeenCalledWith(verifiedUser)
  })

  it('requires a token before submitting manual verification', async () => {
    const user = userEvent.setup()

    renderVerifyEmailPage()

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter the verification token from your email.',
    )
  })

  it('submits a pasted token from the form', async () => {
    const user = userEvent.setup()

    vi.stubGlobal(
      'fetch',
      vi.fn((url, init) => {
        expect(String(url)).toContain('/api/auth/verify-email')
        expect(init.method).toBe('POST')
        expect(JSON.parse(init.body)).toEqual({ token: 'pasted-token-1' })
        return mockJsonResponse({
          user: {
            id: 'user-1',
            email: 'student@umass.edu',
            emailVerified: true,
          },
        })
      }),
    )

    renderVerifyEmailPage()

    await user.type(
      screen.getByLabelText('Verification token'),
      ' pasted-token-1 ',
    )
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(
      await screen.findByText('Email verified. Redirecting…'),
    ).toBeInTheDocument()
  })

  it('treats an already-used token as verified for the current user', async () => {
    const user = userEvent.setup()
    const updateUser = vi.fn()
    const signedInUser = {
      id: 'user-1',
      email: 'student@umass.edu',
      emailVerified: false,
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        mockJsonResponse(
          { message: 'Verification token has already been used' },
          { status: 400 },
        ),
      ),
    )

    renderVerifyEmailPage({
      route: '/verify-email?token=used-token-1',
      authValue: createAuthValue({
        user: signedInUser,
        updateUser,
      }),
    })

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(
      await screen.findByText('Your email is already verified. Redirecting…'),
    ).toBeInTheDocument()
    expect(updateUser).toHaveBeenCalledWith({
      ...signedInUser,
      emailVerified: true,
    })
  })

  it('resends the verification email', async () => {
    const user = userEvent.setup()

    vi.stubGlobal(
      'fetch',
      vi.fn((url, init) => {
        expect(String(url)).toContain('/api/auth/verify-email/resend')
        expect(init.method).toBe('POST')
        return mockJsonResponse({ message: 'Verification email sent.' })
      }),
    )

    renderVerifyEmailPage({
      authValue: createAuthValue({
        user: {
          id: 'user-1',
          email: 'student@umass.edu',
          emailVerified: false,
        },
      }),
    })

    await user.click(screen.getByRole('button', { name: 'Resend email' }))

    expect(
      await screen.findByText('Verification email sent.'),
    ).toBeInTheDocument()
  })
})
