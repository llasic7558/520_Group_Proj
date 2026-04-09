// One-time post-signup welcome banner flag. Uses sessionStorage so it
// clears on tab close and doesn't persist across browser sessions.

const KEY = 'fcc.welcomeBanner'

function safeSession() {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}

export function setWelcomeFlag() {
  const s = safeSession()
  if (s) s.setItem(KEY, '1')
}

export function hasWelcomeFlag() {
  const s = safeSession()
  return s ? s.getItem(KEY) === '1' : false
}

export function clearWelcomeFlag() {
  const s = safeSession()
  if (s) s.removeItem(KEY)
}
