function normalizeApiBase() {
  return (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(
    /\/+$/,
    '',
  )
}

/**
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function resolveProfileImageUrl(raw) {
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s) return ''
  if (/^(data:|https?:|blob:)/i.test(s)) return s
  const path = s.startsWith('/') ? s : `/${s}`
  try {
    return new URL(path, `${normalizeApiBase()}/`).href
  } catch {
    return s
  }
}
