import { Routes, Route } from 'react-router-dom'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from '../pages/LoginPage/LoginPage.jsx'
import { createAuthValue, renderWithProviders } from './test-utils.jsx'

describe('LoginPage', () => {
  it('submits credentials and navigates on success', async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockResolvedValue({
      id: 'user-1',
      email: 'student@umass.edu',
    })

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/opportunities"
          element={<div>Opportunities destination</div>}
        />
      </Routes>,
      {
        route: '/login',
        authValue: createAuthValue({ login }),
      },
    )

    await user.type(screen.getByLabelText('Email'), 'student@umass.edu')
    await user.type(screen.getByLabelText('Password'), 'DemoPass123!')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith('student@umass.edu', 'DemoPass123!'),
    )
    expect(
      await screen.findByText('Opportunities destination'),
    ).toBeInTheDocument()
  })

  it('shows an inline error if sign-in fails', async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockRejectedValue(new Error('Invalid email or password'))

    renderWithProviders(<LoginPage />, {
      authValue: createAuthValue({ login }),
    })

    await user.type(screen.getByLabelText('Email'), 'student@umass.edu')
    await user.type(screen.getByLabelText('Password'), 'wrong-pass')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password',
    )
  })
})
