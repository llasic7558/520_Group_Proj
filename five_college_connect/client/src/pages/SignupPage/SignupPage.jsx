import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.js'
import './SignupPage.css'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      const email = String(formData.get('email') || '').trim()
      const password = String(formData.get('password') || '')
      await signup(email, password)
      navigate('/opportunities', { replace: true })
    } catch (err) {
      setErrorMessage(err?.message || 'Could not create the account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="simple-page">
      <main className="simple-page__main">
        <p className="simple-page__back">
          <Link to="/">← Back</Link>
        </p>
        <h1 className="simple-page__title simple-page__title--sm">Sign up</h1>
        <p className="simple-page__hint">
          Use a Five Colleges email and a password of 8+ characters.
        </p>
        {errorMessage && (
          <p
            role="alert"
            style={{
              color: '#b00020',
              background: '#fdecea',
              border: '1px solid #f5c2c7',
              padding: '0.5rem 0.75rem',
              borderRadius: 4,
              marginBottom: '0.75rem',
            }}
          >
            {errorMessage}
          </p>
        )}
        <form className="simple-form" onSubmit={handleSubmit}>
          <label className="simple-field">
            <span className="simple-field__label">University email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@school.edu"
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
              minLength={8}
              required
            />
          </label>
          <button
            type="submit"
            className="simple-btn simple-btn--primary simple-btn--block"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="simple-page__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </main>
    </div>
  )
}
