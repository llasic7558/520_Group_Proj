import { Link, useNavigate } from 'react-router-dom'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()

  // fake login for now, just sends you to the feed
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
        <h1 className="simple-page__title simple-page__title--sm">Log in</h1>
        <p className="simple-page__hint">
          Use any email and password (they can be left blank for now).
        </p>
        {/* novvalidate so empty fields still work for the demo */}
        <form className="simple-form" onSubmit={handleSubmit} noValidate>
          <label className="simple-field">
            <span className="simple-field__label">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@school.edu"
            />
          </label>
          <label className="simple-field">
            <span className="simple-field__label">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="simple-btn simple-btn--primary simple-btn--block">
            Continue
          </button>
        </form>
        <p className="simple-page__footer">
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </main>
    </div>
  )
}
