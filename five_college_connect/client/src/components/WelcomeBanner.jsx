import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clearWelcomeFlag, hasWelcomeFlag } from '../lib/welcomeFlag.js'

// One-time banner shown at the top of /opportunities after a fresh signup.
// Reads the sessionStorage flag on mount; dismissing clears the flag and
// hides the banner for the rest of the tab session.
export default function WelcomeBanner() {
  const [visible, setVisible] = useState(() => hasWelcomeFlag())

  function handleDismiss() {
    clearWelcomeFlag()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="welcome-banner" role="status">
      <p className="welcome-banner__text">
        Welcome! Add your bio, interests, and skills to your profile.
      </p>
      <Link to="/profile" className="welcome-banner__link">
        Complete profile →
      </Link>
      <button
        type="button"
        className="welcome-banner__dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss welcome message"
      >
        ×
      </button>
    </div>
  )
}
