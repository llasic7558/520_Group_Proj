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
import { setWelcomeFlag } from '../lib/welcomeFlag.js'
import { AuthContext } from './AuthContext.js'

// Builds the full backend signup payload from the wizard's form state.
// Everything the wizard doesn't collect is left empty so the user can
// fill it in later from the Profile page.
function buildSignupPayload(form) {
  return {
    email: form.email,
    password: form.password,
    username: form.email.split('@')[0],
    role: 'student',
    profile: {
      college: collegeFromEmailDomain(form.email),
      fullName: form.fullName,
      major: form.major,
      graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
      bio: '',
      interests: '',
      lookingFor: '',
      skills: [],
      courses: [],
      availability: '',
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

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser)
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
    async (form) => {
      const result = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: buildSignupPayload(form),
      })
      persistAuth(result.authToken, result.user)
      setWelcomeFlag()
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
      updateUser,
      logout,
    }),
    [user, token, login, signup, updateUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
