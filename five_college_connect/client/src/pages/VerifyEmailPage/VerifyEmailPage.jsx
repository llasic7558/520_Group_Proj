import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.js'
import '../shared/simplePages.css'
import './VerifyEmailPage.css'

function useQuery() {
  const location = useLocation()
  return useMemo(() => new URLSearchParams(location.search), [location.search])
}

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const query = useQuery()
  const { user, updateUser } = useAuth()

  const [token, setToken] = useState(() => query.get('token') || '')
  const [status, setStatus] = useState('idle') // idle | verifying | verified | error
  const [message, setMessage] = useState('')
  const [resendStatus, setResendStatus] = useState('idle') // idle | sending | sent | error
  const [resendMessage, setResendMessage] = useState('')

  const email = user?.email || ''

  async function submitVerification(nextToken) {
    const trimmed = (nextToken ?? token).trim()
    if (!trimmed) {
      setStatus('error')
      setMessage('Enter the verification token from your email.')
      return
    }

    setStatus('verifying')
    setMessage('')
    try {
      const result = await apiRequest(
        `/api/auth/verify-email?token=${encodeURIComponent(trimmed)}`,
      )
      if (result?.user) updateUser(result.user)
      setStatus('verified')
      setMessage('Email verified. Redirecting…')
      setTimeout(() => navigate('/opportunities', { replace: true }), 800)
    } catch (err) {
      setStatus('error')
      setMessage(err?.message || 'Could not verify email. Try resending a link.')
    }
  }

  async function resendVerification() {
    setResendStatus('sending')
    setResendMessage('')
    try {
      const result = await apiRequest('/api/auth/verify-email/resend', {
        method: 'POST',
      })
      setResendStatus('sent')
      setResendMessage(result?.message || 'Verification email sent.')
    } catch (err) {
      setResendStatus('error')
      setResendMessage(
        err?.message ||
          'Could not resend verification email. Make sure you are signed in.',
      )
    }
  }

  useEffect(() => {
    const urlToken = query.get('token')
    if (urlToken && urlToken !== token) setToken(urlToken)
    if (urlToken) submitVerification(urlToken)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div className="simple-page">
      <main className="simple-page__main simple-page__main--center">
        <h1 className="simple-page__title">Verify your email</h1>
        <p className="simple-page__lede">
          {email
            ? `We sent a verification link to ${email}.`
            : 'We sent a verification link to your email.'}
        </p>

        {message && (
          <p
            role={status === 'error' ? 'alert' : 'status'}
            className={
              status === 'error'
                ? 'verify-email__message verify-email__message--error'
                : 'verify-email__message'
            }
          >
            {message}
          </p>
        )}

        <form
          className="simple-form"
          onSubmit={(e) => {
            e.preventDefault()
            submitVerification()
          }}
        >
          <label className="simple-field">
            <span className="simple-field__label">Verification token</span>
            <input
              name="token"
              type="text"
              placeholder="Paste token from email link"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
            />
          </label>

          <div className="simple-page__actions">
            <button
              type="submit"
              className="simple-btn simple-btn--primary"
              disabled={status === 'verifying'}
            >
              {status === 'verifying' ? 'Verifying…' : 'Submit'}
            </button>
            <button
              type="button"
              className="simple-btn simple-btn--outline"
              disabled={resendStatus === 'sending'}
              onClick={resendVerification}
              title={!user ? 'Sign up or sign in first to resend.' : undefined}
            >
              {resendStatus === 'sending' ? 'Sending…' : 'Resend email'}
            </button>
          </div>
        </form>

        {resendMessage && (
          <p
            role={resendStatus === 'error' ? 'alert' : 'status'}
            className={
              resendStatus === 'error'
                ? 'verify-email__submessage verify-email__submessage--error'
                : 'verify-email__submessage'
            }
          >
            {resendMessage}
          </p>
        )}

        <p className="simple-page__footer">
          Need a new account? <Link to="/signup">Back to sign up</Link>
        </p>
      </main>
    </div>
  )
}

