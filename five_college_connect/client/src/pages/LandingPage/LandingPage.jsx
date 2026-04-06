import { Link } from 'react-router-dom'
import './LandingPage.css'

// super basic entry page before you log in
export default function LandingPage() {
  return (
    <div className="simple-page">
      <main className="simple-page__main simple-page__main--center">
        <h1 className="simple-page__title">Five College Connect</h1>
        <p className="simple-page__lede">
          Find tutoring, projects, jobs, and study groups across the Five Colleges.
        </p>
        <div className="simple-page__actions">
          <Link className="simple-btn simple-btn--primary" to="/login">
            Log in
          </Link>
          <Link className="simple-btn simple-btn--outline" to="/signup">
            Sign up
          </Link>
        </div>
      </main>
    </div>
  )
}
