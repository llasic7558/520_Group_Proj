import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TopNav } from '../../components/opportunities/TopNav.jsx'
import { IconGithub, IconMail, IconPin, IconShare, IconUserDoc, IconVerified } from '../../components/opportunities/Icons.jsx'
import {
  mockContact,
  mockProfileSeed,
  mockProfileStats,
  mockProjects,
  mockRecentActivity,
  mockUser,
  mockUserCourses,
  mockUserSkills,
} from '../../data/mockProfile.js'
import '../OpportunitiesPage/OpportunitiesPage.css'
import './ProfilePage.css'

// picks a slightly different style for "codey" skills on the cards
function skillIconClass(name) {
  const n = name.toLowerCase()
  if (n.includes('java') || n.includes('script') || n.includes('python') || n.includes('react') || n.includes('node')) {
    return 'prof-skill-card__icon prof-skill-card__icon--code'
  }
  return 'prof-skill-card__icon'
}

export default function ProfilePage() {
  // saved profile fields (starts from mock json)
  const [profile, setProfile] = useState(() => ({ ...mockProfileSeed }))
  const [isEditing, setIsEditing] = useState(false)
  // temporary copy while youre editing so cancel can throw it away
  const [draft, setDraft] = useState(null)

  function startEdit() {
    setDraft({ ...profile })
    setIsEditing(true)
  }

  function cancelEdit() {
    setDraft(null)
    setIsEditing(false)
  }

  function saveEdit() {
    if (draft) setProfile(draft)
    setDraft(null)
    setIsEditing(false)
  }

  // what we show in the ui (either live profile or the unsaved draft)
  const display = isEditing && draft ? draft : profile

  return (
    <div className="prof-app">
      <TopNav searchPlaceholder="Search for opportunities, skills, or students..." />

      <div className="prof-shell">
        <div className="prof-main">
          <header className="prof-hero">
            <div className="prof-hero__banner" />
            <div className="prof-hero__inner">
              <div className="prof-hero__avatar-wrap">
                {/* no real image url in mock data yet so its just a gray circle */}
                <div className="prof-hero__avatar" role="img" aria-label={display.full_name} />
                {mockUser.email_verified ? (
                  <span className="prof-hero__verified" title="Verified student">
                    <IconVerified />
                  </span>
                ) : null}
              </div>
              <div className="prof-hero__info">
                {/* edit mode shows a small grid of inputs instead of the big name text */}
                {isEditing && draft ? (
                  <div className="prof-edit-fields prof-edit-fields--hero">
                    <label className="prof-field">
                      <span>Full name</span>
                      <input
                        value={draft.full_name}
                        onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
                      />
                    </label>
                    <label className="prof-field">
                      <span>College</span>
                      <input
                        value={draft.college}
                        onChange={(e) => setDraft({ ...draft, college: e.target.value })}
                      />
                    </label>
                    <label className="prof-field">
                      <span>Graduation year</span>
                      <input
                        type="number"
                        value={draft.graduation_year}
                        onChange={(e) =>
                          // empty input becomes '' so we dont save nan
                          setDraft({ ...draft, graduation_year: Number(e.target.value) || '' })
                        }
                      />
                    </label>
                    <label className="prof-field prof-field--full">
                      <span>Major</span>
                      <input
                        value={draft.major}
                        onChange={(e) => setDraft({ ...draft, major: e.target.value })}
                      />
                    </label>
                  </div>
                ) : (
                  <>
                    <h1 className="prof-hero__name">{display.full_name}</h1>
                    <p className="prof-hero__line">
                      {display.college} • Class of {display.graduation_year || '—'}
                    </p>
                    <p className="prof-hero__major">{display.major}</p>
                  </>
                )}
                <div className="prof-hero__actions">
                  {isEditing ? (
                    <>
                      <button type="button" className="prof-btn prof-btn--primary" onClick={saveEdit}>
                        Save changes
                      </button>
                      <button type="button" className="prof-btn prof-btn--outline" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="prof-btn prof-btn--primary" onClick={startEdit}>
                        Edit Profile
                      </button>
                      <button type="button" className="prof-icon-round" aria-label="Share profile">
                        <IconShare />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="prof-stats">
            <div className="prof-stats__item">
              <strong>{mockProfileStats.connection_count}</strong>
              <span>Connections</span>
            </div>
            <div className="prof-stats__sep" />
            <div className="prof-stats__item">
              <strong>{mockProfileStats.skill_count}</strong>
              <span>Skills</span>
            </div>
            <div className="prof-stats__sep" />
            <div className="prof-stats__item">
              <strong>{mockProfileStats.project_count}</strong>
              <span>Projects</span>
            </div>
            <div className="prof-stats__sep" />
            <div className="prof-stats__item">
              <strong>{mockProfileStats.application_count}</strong>
              <span>Applications</span>
            </div>
          </div>

          <section className="prof-section">
            <h2 className="prof-section__title">
              <IconUserDoc />
              About
            </h2>
            {isEditing && draft ? (
              <label className="prof-field prof-field--block">
                <span>Bio</span>
                <textarea
                  rows={5}
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                />
              </label>
            ) : (
              <p className="prof-section__body">{display.bio}</p>
            )}
          </section>

          <section className="prof-section">
            <div className="prof-section__head">
              <h2 className="prof-section__title">Skills &amp; Expertise</h2>
              <button type="button" className="prof-link-btn" disabled={isEditing}>
                + Add Skill
              </button>
            </div>
            <div className="prof-skills">
              {mockUserSkills.map((s) => (
                <div key={s.user_skill_id} className="prof-skill-card">
                  {/* fake icon, real app would use per-skill icons */}
                  <span className={skillIconClass(s.skill_name)} aria-hidden>
                    {'</>'}
                  </span>
                  <div>
                    <div className="prof-skill-card__name">{s.skill_name}</div>
                    <div className="prof-skill-card__level">{s.proficiency_level}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="prof-section">
            <div className="prof-section__head">
              <h2 className="prof-section__title">Completed Courses</h2>
              <Link className="prof-text-link" to="/opportunities">
                View All (24)
              </Link>
            </div>
            <div className="prof-courses">
              {mockUserCourses.map((c) => (
                <div key={c.user_course_id} className="prof-course-card">
                  <div className="prof-course-card__name">
                    {c.course_code} {c.course_name}
                  </div>
                  <div className="prof-course-card__grade">{c.grade}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="prof-section">
            <div className="prof-section__head">
              <h2 className="prof-section__title">Featured Projects</h2>
              <button type="button" className="prof-link-btn" disabled={isEditing}>
                + Add Project
              </button>
            </div>
            <div className="prof-projects">
              {mockProjects.map((p) => (
                <article key={p.project_id} className="prof-project-card">
                  <div className="prof-project-card__thumb" aria-hidden />
                  <div className="prof-project-card__body">
                    <h3 className="prof-project-card__title">{p.title}</h3>
                    <p className="prof-project-card__desc">{p.description}</p>
                    <div className="prof-project-card__tags">
                      {p.tags.map((t) => (
                        <span key={t} className="prof-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="prof-aside">
          <section className="prof-card">
            <h3 className="prof-card__title">Availability</h3>
            {isEditing && draft ? (
              <label className="prof-field prof-field--block">
                <textarea
                  rows={3}
                  value={draft.availability}
                  onChange={(e) => setDraft({ ...draft, availability: e.target.value })}
                />
              </label>
            ) : (
              <p className="prof-card__text">{display.availability}</p>
            )}
            <span className="prof-pill prof-pill--ok">Available for opportunities</span>
          </section>

          <section className="prof-card">
            <h3 className="prof-card__title">Contact</h3>
            <ul className="prof-contact-list">
              <li>
                <IconMail />
                {mockContact.email}
              </li>
              <li>
                <IconPin />
                {mockContact.location}
              </li>
              <li>
                <IconGithub />
                <a href={mockContact.github_url} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </li>
            </ul>
          </section>

          <section className="prof-card">
            <h3 className="prof-card__title">Looking for</h3>
            {isEditing && draft ? (
              <label className="prof-field prof-field--block">
                <textarea
                  rows={3}
                  value={draft.looking_for}
                  onChange={(e) => setDraft({ ...draft, looking_for: e.target.value })}
                />
              </label>
            ) : (
              <p className="prof-card__text">{display.looking_for}</p>
            )}
          </section>

          <section className="prof-card">
            <h3 className="prof-card__title">Interests</h3>
            {isEditing && draft ? (
              <label className="prof-field prof-field--block">
                <span>Interests (comma-separated)</span>
                <textarea
                  rows={2}
                  value={draft.interests}
                  onChange={(e) => setDraft({ ...draft, interests: e.target.value })}
                />
              </label>
            ) : (
              <div className="prof-tags">
                {/* interests is one string in the db, we split on commas for chips */}
                {display.interests
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t) => (
                    <span key={t} className="prof-tag prof-tag--muted">
                      {t}
                    </span>
                  ))}
              </div>
            )}
          </section>

          <section className="prof-card">
            <h3 className="prof-card__title">Recent Activity</h3>
            <ul className="prof-activity">
              {mockRecentActivity.map((a) => (
                <li key={a.id}>
                  <span className="prof-activity__dot" />
                  <div>
                    <p>{a.message}</p>
                    <time>{a.occurred_at_label}</time>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
