import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.js'
import { collegeFromEmailDomain } from '../../lib/colleges.js'
import { logError, logInfo, logWarn } from '../../lib/logger.js'
import './SignupPage.css'

const ALLOWED_DOMAINS = [
  'umass.edu',
  'amherst.edu',
  'smith.edu',
  'hampshire.edu',
  'mtholyoke.edu',
]

// Backend messages that mean "the problem is on Step 1" and should rewind
// the wizard instead of showing inline on Step 2.
const REWIND_MESSAGES = new Set([
  'An account with that email already exists',
  'A Five Colleges email address is required',
  'password must be at least 8 characters long',
  'email, username, and password are required',
])

const CURRENT_YEAR = new Date().getFullYear()

function extractDomain(email) {
  const at = email.lastIndexOf('@')
  return at === -1 ? '' : email.slice(at + 1).toLowerCase().trim()
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [state, setState] = useState({
    step: 1,
    form: {
      email: '',
      password: '',
      fullName: '',
      major: '',
      graduationYear: '',
    },
    errorMessage: '',
    isSubmitting: false,
  })

  function updateField(name, value) {
    setState((s) => ({ ...s, form: { ...s.form, [name]: value } }))
  }

  function setStep(step) {
    setState((s) => ({ ...s, step, errorMessage: '' }))
  }

  function handleStep1Next(e) {
    e.preventDefault()
    const domain = extractDomain(state.form.email)
    if (!ALLOWED_DOMAINS.includes(domain)) {
      logWarn('Signup blocked due to invalid email domain', { domain })
      setState((s) => ({
        ...s,
        errorMessage:
          'Use a umass.edu, amherst.edu, smith.edu, hampshire.edu, or mtholyoke.edu email.',
      }))
      return
    }
    setStep(2)
  }

  async function handleFinalSubmit(e) {
    e.preventDefault()
    setState((s) => ({ ...s, errorMessage: '', isSubmitting: true }))
    try {
      const createdUser = await signup(state.form)
      logInfo('Signup wizard completed successfully', {
        email: state.form.email,
      })
      if (createdUser?.emailVerified) {
        navigate('/opportunities', { replace: true })
      } else {
        navigate('/verify-email', { replace: true })
      }
    } catch (err) {
      logError('Signup wizard failed', {
        email: state.form.email,
        error: err instanceof Error ? err.message : String(err),
      })
      const isAccountError =
        typeof err?.status === 'number' &&
        err.status >= 400 &&
        err.status < 500 &&
        (REWIND_MESSAGES.has(err?.message) || err.status === 409)

      if (isAccountError) {
        setState((s) => ({
          ...s,
          step: 1,
          errorMessage: err.message,
          isSubmitting: false,
        }))
      } else {
        setState((s) => ({
          ...s,
          errorMessage: err?.message || 'Could not create the account.',
          isSubmitting: false,
        }))
      }
    }
  }

  const derivedCollege = state.form.email
    ? collegeFromEmailDomain(state.form.email)
    : ''

  return (
    <div className="simple-page">
      <main id="main-content" tabIndex={-1} className="simple-page__main">
        <p className="simple-page__back">
          <Link to="/">← Back</Link>
        </p>

        <div className="signup-steps">
          <div className="signup-steps__step">
            <span
              className={
                state.step === 1
                  ? 'signup-steps__dot signup-steps__dot--current'
                  : 'signup-steps__dot signup-steps__dot--done'
              }
            />
            <span
              className={
                state.step === 1
                  ? 'signup-steps__label signup-steps__label--current'
                  : 'signup-steps__label'
              }
            >
              Account
            </span>
          </div>
          <div className="signup-steps__step">
            <span
              className={
                state.step === 2
                  ? 'signup-steps__dot signup-steps__dot--current'
                  : 'signup-steps__dot'
              }
            />
            <span
              className={
                state.step === 2
                  ? 'signup-steps__label signup-steps__label--current'
                  : 'signup-steps__label'
              }
            >
              Profile
            </span>
          </div>
        </div>

        {state.errorMessage && (
          <p role="alert" className="signup-error">
            {state.errorMessage}
          </p>
        )}

        {state.step === 1 && (
          <>
            <h1 className="simple-page__title simple-page__title--sm">
              Create your account
            </h1>
            <p className="simple-page__hint">Step 1 of 2</p>
            <form className="simple-form" onSubmit={handleStep1Next}>
              <label className="simple-field">
                <span className="simple-field__label">University email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@school.edu"
                  value={state.form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                />
              </label>
              <label className="simple-field">
                <span className="simple-field__label">Password</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={state.form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <div className="signup-nav signup-nav--end">
                <button
                  type="submit"
                  className="simple-btn simple-btn--primary"
                >
                  Next →
                </button>
              </div>
            </form>
          </>
        )}

        {state.step === 2 && (
          <>
            <h1 className="simple-page__title simple-page__title--sm">
              Tell us about you
            </h1>
            <p className="simple-page__hint">Step 2 of 2</p>
            <form className="simple-form" onSubmit={handleFinalSubmit}>
              <label className="simple-field">
                <span className="simple-field__label">Full name</span>
                <input
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={state.form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  required
                />
              </label>
              <div className="simple-field">
                <span className="simple-field__label">College</span>
                <div className="signup-readonly">
                  {derivedCollege || 'Unknown'}
                </div>
              </div>
              <label className="simple-field">
                <span className="simple-field__label">Major</span>
                <input
                  name="major"
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={state.form.major}
                  onChange={(e) => updateField('major', e.target.value)}
                  required
                />
              </label>
              <label className="simple-field">
                <span className="simple-field__label">Graduation year</span>
                <input
                  name="graduationYear"
                  type="number"
                  placeholder={String(CURRENT_YEAR + 2)}
                  value={state.form.graduationYear}
                  onChange={(e) =>
                    updateField('graduationYear', e.target.value)
                  }
                  min={CURRENT_YEAR}
                  max={CURRENT_YEAR + 10}
                  required
                />
              </label>
              <p className="signup-hint">
                You can add your bio, interests, and skills after signing up —
                we&rsquo;ll remind you.
              </p>
              <div className="signup-nav">
                <button
                  type="button"
                  className="simple-btn simple-btn--outline"
                  onClick={() => setStep(1)}
                  disabled={state.isSubmitting}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="simple-btn simple-btn--primary"
                  disabled={state.isSubmitting}
                >
                  {state.isSubmitting ? 'Creating account…' : 'Create account'}
                </button>
              </div>
            </form>
          </>
        )}

        <p className="simple-page__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </main>
    </div>
  )
}
