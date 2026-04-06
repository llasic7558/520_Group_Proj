import { Link, useNavigate } from 'react-router-dom'
import './SignupPage.css'

export default function SignupPage() {
  const navigate = useNavigate()

  // not hooked to a real backend yet, just routes to opportunities
  function handleSubmit(e) {
    e.preventDefault()
    navigate('/opportunities', { replace: true })
  }

  return (
    <div className="simple-page">
      <main className="simple-page__main">
        <p className="simple-page__back">
          <Link to="/">← Back</Link>
        </p>
        <h1 className="simple-page__title simple-page__title--sm">Sign up</h1>
        <p className="simple-page__hint">
          All fields are optional for now—you can submit with empty values.
        </p>
        {/* same as login, skip browser validation for now */}
        <form className="simple-form" onSubmit={handleSubmit} noValidate>
          <label className="simple-field">
            <span className="simple-field__label">University email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@school.edu"
            />
          </label>
          <label className="simple-field">
            <span className="simple-field__label">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a password"
            />
          </label>
          <button type="submit" className="simple-btn simple-btn--primary simple-btn--block">
            Create account
          </button>
        </form>
        <p className="simple-page__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </main>
    </div>
  )
}
