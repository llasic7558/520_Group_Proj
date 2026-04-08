
// Thin wrapper over localStorage so the rest of the app never touches
// localStorage directly. Lets us swap storage strategy later (sessionStorage,
// cookie, in-memory) without changing callers.

const TOKEN_KEY = 'fcc.token'
const USER_KEY = 'fcc.user'

function safeStorage() {
  // SSR safety / private mode safety: localStorage may not exist.
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function getToken() {
  const s = safeStorage()
  return s ? s.getItem(TOKEN_KEY) : null
}

export function setToken(token) {
  const s = safeStorage()
  if (s) s.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  const s = safeStorage()
  if (s) s.removeItem(TOKEN_KEY)
}

export function getUser() {
  const s = safeStorage()
  if (!s) return null
  const raw = s.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setUser(user) {
  const s = safeStorage()
  if (s) s.setItem(USER_KEY, JSON.stringify(user))
}

export function clearUser() {
  const s = safeStorage()
  if (s) s.removeItem(USER_KEY)
}

export function clearAll() {
  clearToken()
  clearUser()
}
