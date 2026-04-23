import { Link } from 'react-router-dom'
import './LandingPage.css'

// super basic entry page before you log in
export default function LandingPage() {
  return (
    <div className="simple-page">
      <main className="simple-page__main simple-page__main--center landing-main">
        <header className="landing-hero">
          <p className="landing-kicker">five college connect</p>
          <h1 className="simple-page__title">Meet people. Find help. Build stuff.</h1>
          <p className="simple-page__lede">
            A shared space for Amherst, Hampshire, Mount Holyoke, Smith, and UMass students to
            connect around tutoring, projects, jobs, and study groups.
          </p>

          <div className="simple-page__actions">
            <Link className="simple-btn simple-btn--primary" to="/login">
              Log in
            </Link>
            <Link className="simple-btn simple-btn--outline" to="/signup">
              Sign up
            </Link>
          </div>
        </header>

        <section className="landing-section" aria-labelledby="landing-features-title">
          <h2 className="landing-section__title" id="landing-features-title">
            What you can do
          </h2>
          <div className="landing-grid">
            <article className="landing-card">
              <h3 className="landing-card__title">Browse opportunities</h3>
              <p className="landing-card__body">
                Find tutoring, research, part-time work, clubs, and group projects — all in one feed.
              </p>
            </article>
            <article className="landing-card">
              <h3 className="landing-card__title">Post what you need</h3>
              <p className="landing-card__body">
                Create a listing for your role, your study group, or the help you’re looking for.
              </p>
            </article>
            <article className="landing-card">
              <h3 className="landing-card__title">Show your profile</h3>
              <p className="landing-card__body">
                Keep a simple profile with your college, skills, courses, and what you’re into.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="landing-how-title">
          <h2 className="landing-section__title" id="landing-how-title">
            How it works
          </h2>
          <ol className="landing-steps">
            <li className="landing-step">
              <span className="landing-step__num">1</span>
              <div className="landing-step__content">
                <p className="landing-step__title">Create an account</p>
                <p className="landing-step__body">Sign up, then log in to unlock the app.</p>
              </div>
            </li>
            <li className="landing-step">
              <span className="landing-step__num">2</span>
              <div className="landing-step__content">
                <p className="landing-step__title">Explore and save time</p>
                <p className="landing-step__body">
                  Browse the opportunities feed and open a listing to see details.
                </p>
              </div>
            </li>
            <li className="landing-step">
              <span className="landing-step__num">3</span>
              <div className="landing-step__content">
                <p className="landing-step__title">Post your own listing</p>
                <p className="landing-step__body">
                  Need a tutor? Recruiting for a project? Create a posting and share it.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className="landing-section landing-section--cta" aria-labelledby="landing-cta-title">
          <h2 className="landing-section__title" id="landing-cta-title">
            Ready to jump in?
          </h2>
          <p className="landing-cta__body">
            Start with a quick profile, then browse opportunities or create a posting when you’re ready.
          </p>
          <div className="simple-page__actions">
            <Link className="simple-btn simple-btn--primary" to="/signup">
              Create an account
            </Link>
            <Link className="simple-btn simple-btn--outline" to="/login">
              I already have one
            </Link>
          </div>
        </section>

        <footer className="simple-page__footer">
          Built for the Five Colleges community. For now, sign in to explore opportunities and create
          postings.
        </footer>
      </main>
    </div>
  )
}
