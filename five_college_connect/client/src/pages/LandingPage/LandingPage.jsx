import { Link } from 'react-router-dom'
import './LandingPage.css'
import umassHero from './umass.jpg'

// super basic entry page before you log in
export default function LandingPage() {
  return (
    <div className="simple-page">
      <main id="main-content" tabIndex={-1} className="simple-page__main simple-page__main--center landing-main">
        <header className="landing-hero">
          <div className="landing-hero__grid">
            <div className="landing-hero__copy">
              <p className="landing-kicker">Five College Connect</p>
              <h1 className="landing-hero__title">
                Opportunities.
                <br />
                Connections.
                <br />
                <span className="landing-hero__accent">Across Five Colleges.</span>
              </h1>
              <p className="landing-hero__lede">
                Find tutoring, projects, jobs, and study groups with students across Amherst, Hampshire,
                Mount Holyoke, Smith, and UMass.
              </p>

              <div className="simple-page__actions landing-hero__actions">
                <Link className="simple-btn simple-btn--primary" to="/login">
                  Log in
                </Link>
                <Link className="simple-btn simple-btn--outline" to="/signup">
                  Sign up
                </Link>
              </div>

              <div className="landing-pills" aria-label="Popular categories">
                <span className="landing-pill">Tutoring</span>
                <span className="landing-pill">Projects</span>
                <span className="landing-pill">Jobs</span>
                <span className="landing-pill">Study groups</span>
              </div>
            </div>

            <div className="landing-hero__visual" aria-hidden="true">
              <img
                className="landing-hero__image"
                src={umassHero}
                alt=""
                width="800"
                height="480"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </header>

        {/*
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
        */}

        <footer className="simple-page__footer">
          Built for the Five Colleges community. Sign in to explore opportunities and create postings.
        </footer>
      </main>
    </div>
  )
}
