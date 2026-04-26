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
import { logError, logInfo } from '../lib/logger.js'
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
      try {
        const result = await apiRequest('/api/auth/signin', {
          method: 'POST',
          body: { email, password },
        })
        persistAuth(result.authToken, result.user)
        logInfo('User signed in', {
          userId: result.user?.id,
          email: result.user?.email,
        })
        return result.user
      } catch (error) {
        logError('Sign-in failed', {
          email,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    [persistAuth],
  )

  const signup = useCallback(
    async (form) => {
      try {
        const result = await apiRequest('/api/auth/signup', {
          method: 'POST',
          body: buildSignupPayload(form),
        })
        persistAuth(result.authToken, result.user)
        setWelcomeFlag()
        logInfo('User signed up', {
          userId: result.user?.id,
          email: result.user?.email,
        })
        return result.user
      } catch (error) {
        logError('Sign-up failed', {
          email: form?.email,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    [persistAuth],
  )

  const logout = useCallback(() => {
    clearAll()
    setTokenState(null)
    setUserState(null)
    logInfo('User signed out')
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
