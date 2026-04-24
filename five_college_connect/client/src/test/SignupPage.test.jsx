import { Route, Routes } from 'react-router-dom'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SignupPage from '../pages/SignupPage/SignupPage.jsx'
import { createAuthValue, renderWithProviders } from './test-utils.jsx'

describe('SignupPage', () => {
  it('blocks step 1 for a non-five-colleges email', async () => {
    const user = userEvent.setup()

    renderWithProviders(<SignupPage />, {
      authValue: createAuthValue(),
    })

    await user.type(screen.getByLabelText('University email'), 'user@gmail.com')
    await user.type(screen.getByLabelText('Password'), 'StrongPass123')
    await user.click(screen.getByRole('button', { name: /Next/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Use a umass.edu, amherst.edu, smith.edu, hampshire.edu, or mtholyoke.edu email.',
    )
  })

  it('completes the two-step signup flow and navigates on success', async () => {
    const user = userEvent.setup()
    const signup = vi.fn().mockResolvedValue({
      id: 'user-1',
      email: 'newuser@umass.edu',
    })

    renderWithProviders(
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/opportunities"
          element={<div>Signed up successfully</div>}
        />
      </Routes>,
      {
        route: '/signup',
        authValue: createAuthValue({ signup }),
      },
    )

    await user.type(
      screen.getByLabelText('University email'),
      'newuser@umass.edu',
    )
    await user.type(screen.getByLabelText('Password'), 'StrongPass123')
    await user.click(screen.getByRole('button', { name: /Next/i }))

    expect(await screen.findByText('Step 2 of 2')).toBeInTheDocument()
    expect(screen.getByText('UMass Amherst')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Full name'), 'New User')
    await user.type(screen.getByLabelText('Major'), 'Computer Science')
    await user.type(screen.getByLabelText('Graduation year'), '2027')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() =>
      expect(signup).toHaveBeenCalledWith({
        email: 'newuser@umass.edu',
        password: 'StrongPass123',
        fullName: 'New User',
        major: 'Computer Science',
        graduationYear: '2027',
      }),
    )

    expect(
      await screen.findByText('Signed up successfully'),
    ).toBeInTheDocument()
  })
})
