import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LandingPage from '../pages/LandingPage/LandingPage.jsx'
import { renderWithProviders } from './test-utils.jsx'

describe('LandingPage', () => {
  it('renders the entry copy and auth calls to action', () => {
    renderWithProviders(<LandingPage />)

    expect(
      screen.getByRole('heading', {
        name: /Opportunities\..*Connections\..*Across Five Colleges\./i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute(
      'href',
      '/signup',
    )
    expect(screen.getByLabelText('Popular categories')).toBeInTheDocument()
  })
})
