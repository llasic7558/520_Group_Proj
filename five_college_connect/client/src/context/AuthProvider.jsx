import { useCallback, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api.js'
import {
  clearAll,
  getToken,
  getUser,
  setToken,
  setUser,
} from '../lib/authStorage.js'
import { collegeFromEmailDomain } from '../lib/colleges.js'
import { AuthContext } from './AuthContext.js'

// Builds the full backend signup payload from just (email, password).
// Per the spec we keep the form simple and give defaults for everything else.
function buildSignupPayload(email, password) {
  return {
    email,
    password,
    username: email.split('@')[0],
    role: 'student',
    profile: {
      college: collegeFromEmailDomain(email),
      fullName: '',
      bio: '',
      major: '',
      graduationYear: null,
      skills: [],
      courses: [],
      interests: '',
      availability: '',
      lookingFor: '',
      profileImageUrl: '',
    },
  }
}

export function AuthProvider({ children }) {
  // Initialize from localStorage so a page reload keeps the user signed in.
  const [token, setTokenState] = useState(() => getToken())
  const [user, setUserState] = useState(() => getUser())

  const persistAuth = useCallback((nextToken, nextUser) => {
    setToken(nextToken)
    setUser(nextUser)
    setTokenState(nextToken)
    setUserState(nextUser)
  }, [])

  const login = useCallback(
    async (email, password) => {
      const result = await apiRequest('/api/auth/signin', {
        method: 'POST',
        body: { email, password },
      })
      persistAuth(result.authToken, result.user)
      return result.user
    },
    [persistAuth],
  )

  const signup = useCallback(
    async (email, password) => {
      const result = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: buildSignupPayload(email, password),
      })
      persistAuth(result.authToken, result.user)
      return result.user
    },
    [persistAuth],
  )

  const logout = useCallback(() => {
    clearAll()
    setTokenState(null)
    setUserState(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      signup,
      logout,
    }),
    [user, token, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
