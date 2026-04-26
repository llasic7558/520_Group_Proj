import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.js'
import { resendVerificationEmail } from '../lib/api.js'

// Shown under the welcome banner on /opportunities when the user is signed in
// but has not verified their email yet. Sends a new verification email and
// navigates to the verification page.
export default function EmailVerificationBanner() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (!isAuthenticated || !user || user.emailVerified) {
    return null
  }

  async function handleVerify() {
    setErrorMessage('')
    setLoading(true)
    try {
      await resendVerificationEmail()
      navigate('/verify-email')
    } catch (err) {
      setErrorMessage(
        err?.message || 'Could not send a verification email. Try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="email-verify-banner" role="status">
      <div className="email-verify-banner__inner">
        <p className="email-verify-banner__text">
          Please verify your school email to use all features. Check your inbox
          for a link, or we can send another.
        </p>
        {errorMessage ? (
          <p className="email-verify-banner__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <button
          type="button"
          className="email-verify-banner__action"
          onClick={handleVerify}
          disabled={loading}
        >
          {loading ? 'Sending…' : 'Resend and verify →'}
        </button>
      </div>
    </div>
  )
}
