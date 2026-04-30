import { createContext, useContext } from 'react'

// Holds the auth state shape: { user, token, isAuthenticated, login, signup, logout }.
export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>')
  }
  return ctx
}
