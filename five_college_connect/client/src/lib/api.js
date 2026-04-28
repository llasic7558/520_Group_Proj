// Centralized fetch wrapper. Every API call goes through apiRequest().

import { clearAll, getToken } from './authStorage.js'
import { logError, logInfo, logWarn } from './logger.js'

const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_URL || 'http://localhost:4000',
)

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(buildApiUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    logError('API request failed to reach server', {
      method,
      path,
      error: error instanceof Error ? error.message : String(error),
    })
    throw new ApiError(
      'Could not reach the server. Is it running?',
      0,
      null,
    )
  }

  // Try to parse JSON; some error responses may not have a body.
  let payload = null
  const text = await response.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text }
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Stale or invalid token — drop it so subsequent navigations
      // fall through ProtectedRoute back to /login.
      logWarn('API request returned unauthorized', {
        method,
        path,
        status: response.status,
      })
      clearAll()
    } else if (response.status >= 500) {
      logError('API request returned server error', {
        method,
        path,
        status: response.status,
        payload,
      })
    } else {
      logWarn('API request returned client error', {
        method,
        path,
        status: response.status,
        payload,
      })
    }
    const message =
      (payload && (payload.message || payload.error)) ||
      `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, payload)
  }

  if (method !== 'GET') {
    logInfo('API request completed', {
      method,
      path,
      status: response.status,
    })
  }

  return payload
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '')
}

function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

function buildQueryString(params) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    const normalized = typeof value === 'string' ? value.trim() : value
    if (normalized === '') return
    query.set(key, String(normalized))
  })

  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export async function fetchListings(filters = {}) {
  const payload = await apiRequest(
    `/api/listings${buildQueryString(filters)}`,
  )
  return payload?.items ?? []
}

export async function createListing(body) {
  const payload = await apiRequest('/api/listings', {
    method: 'POST',
    body,
  })
  return payload?.listing ?? null
}

export async function fetchListing(listingId) {
  const payload = await apiRequest(`/api/listings/${listingId}`)
  return payload?.listing ?? null
}

export async function closeListing(listingId) {
  const payload = await apiRequest(`/api/listings/${listingId}`, {
    method: 'DELETE',
  })
  return payload?.listing ?? null
}

export async function fetchApplications(filters = {}) {
  const payload = await apiRequest(
    `/api/applications${buildQueryString(filters)}`,
  )
  return payload?.items ?? []
}

export async function createApplication(body) {
  const payload = await apiRequest('/api/applications', {
    method: 'POST',
    body,
  })
  return payload?.application ?? null
}

export async function fetchProfile(userId) {
  const payload = await apiRequest(`/api/profiles/${userId}`)
  return payload?.profile ?? null
}

export async function updateProfile(userId, body) {
  const payload = await apiRequest(`/api/profiles/${userId}`, {
    method: 'PUT',
    body,
  })
  return payload?.profile ?? null
}

export async function resendVerificationEmail() {
  return apiRequest('/api/auth/verify-email/resend', { method: 'POST' })
}
