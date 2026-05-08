import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthContext } from '../src/context/AuthContext.js'

export function createAuthValue(overrides = {}) {
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    signup: vi.fn(),
    updateUser: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  }
}

export function renderWithProviders(
  ui,
  { route = '/', authValue = createAuthValue() } = {},
) {
  // Most page tests need the same auth context and router shell.
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthContext.Provider>,
  )
}

export function mockJsonResponse(body, { status = 200 } = {}) {
  // Keep fetch mocks close to the browser Response shape used by apiRequest().
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  )
}
