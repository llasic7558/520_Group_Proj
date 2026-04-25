import { useEffect, useState } from 'react'
import { createApplication } from '../../lib/api.js'
import {
  CATEGORY_META,
  contactMethodLabel,
  creatorSubtitle,
  listingPostedDisplayLabel,
} from '../../data/postings.js'
import {
  IconBookmark,
  IconCalendar,
  IconClock,
  IconMail,
  IconMessage,
  IconPay,
  IconPin,
  IconSend,
  IconShare,
  IconVerified,
} from './Icons.jsx'

const APPLICATION_MESSAGE_MIN_LENGTH = 1

function categoryChipClass(category) {
  return CATEGORY_META[category]?.chipClass ?? 'chipTutoring'
}

// right side panel when you click a posting in the list
export function OpportunityDetail({
  posting,
  hasApplied = false,
  onApplicationCreated,
}) {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [applicationError, setApplicationError] = useState('')
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false)

  const listingId = posting?.listing_id

  useEffect(() => {
    setIsApplyModalOpen(false)
    setApplicationMessage('')
    setApplicationError('')
    setIsSubmittingApplication(false)
  }, [listingId])

  if (!posting) {
    return (
      <section className="fcc-detail fcc-detail--empty">
        <p>Select an opportunity to view details.</p>
      </section>
    )
  }

  const cat = CATEGORY_META[posting.category]
  const profile = posting.creator?.profile
  const user = posting.creator
  const posted = listingPostedDisplayLabel(
    posting.created_at,
    'Posted recently',
  )
  const skills = posting.listing_skills ?? []

  // mush method + extra contact info into one line for the ui
  const contactLines = [
    contactMethodLabel(posting.contact_method),
    posting.contact_details?.trim(),
  ].filter(Boolean)

  const closeApplyModal = () => {
    if (isSubmittingApplication) return
    setIsApplyModalOpen(false)
    setApplicationMessage('')
    setApplicationError('')
  }

  const handleApplySubmit = async (event) => {
    event.preventDefault()

    const message = applicationMessage.trim()
    if (message.length < APPLICATION_MESSAGE_MIN_LENGTH) {
      setApplicationError('Add a short message before submitting.')
      return
    }

    setIsSubmittingApplication(true)
    setApplicationError('')

    try {
      const application = await createApplication({
        listingId,
        message,
      })
      onApplicationCreated?.(application)
      setIsApplyModalOpen(false)
      setApplicationMessage('')
    } catch (err) {
      setApplicationError(
        err?.message || 'Could not submit your application right now.',
      )
    } finally {
      setIsSubmittingApplication(false)
    }
  }

  return (
    <section className="fcc-detail" aria-label="Opportunity details">
      <header className="fcc-detail__header">
        <div className="fcc-detail__title-row">
          <h2 className="fcc-detail__title">{posting.title}</h2>
          {/* bookmark/share dont do anything yet */}
          <div className="fcc-detail__actions">
            <button type="button" className="fcc-icon-btn" aria-label="Save">
              <IconBookmark />
            </button>
            <button type="button" className="fcc-icon-btn" aria-label="Share">
              <IconShare />
            </button>
          </div>
        </div>
        <span
          className={`fcc-category-tag fcc-category-tag--${categoryChipClass(posting.category)}`}
        >
          {cat.label}
        </span>
        <p className="fcc-detail__poster">
          {profile?.full_name} • {profile?.college}
        </p>
        <div className="fcc-detail__meta">
          <span className="fcc-meta-item fcc-meta-item--lg">
            <IconPin />
            {posting.location_short || '—'}
          </span>
          {posting.compensation_summary ? (
            <span className="fcc-meta-item fcc-meta-item--lg">
              <IconPay />
              {posting.compensation_summary}
            </span>
          ) : null}
          <span className="fcc-meta-item fcc-meta-item--lg">
            <IconClock />
            {posted}
          </span>
        </div>
      </header>

      <div className="fcc-detail__sections">
        <section className="fcc-section">
          <h3 className="fcc-section__title">About this opportunity</h3>
          <p className="fcc-section__body">{posting.description}</p>
        </section>

        <section className="fcc-section">
          <h3 className="fcc-section__title">Required Skills</h3>
          <div className="fcc-skill-tags">
            {skills.map((ls) => (
              <span
                key={ls.listing_skill_id}
                className="fcc-skill-tag"
                title={
                  ls.requirement_type
                    ? `Requirement: ${ls.requirement_type}`
                    : undefined
                }
              >
                {ls.skill_name}
                {ls.requirement_type === 'preferred' ? ' (preferred)' : ''}
              </span>
            ))}
          </div>
        </section>

        <section className="fcc-section">
          <h3 className="fcc-section__title">Preferred Times</h3>
          <ul className="fcc-time-list">
            {(posting.preferred_availability ?? []).map((slot) => (
              <li key={slot} className="fcc-time-pill">
                <IconCalendar />
                {slot}
              </li>
            ))}
          </ul>
        </section>

        <section className="fcc-section">
          <h3 className="fcc-section__title">Contact Method</h3>
          <div className="fcc-contact-bar">
            <IconMail />
            <span>
              {contactLines.join(' · ') || contactMethodLabel(posting.contact_method)}
            </span>
          </div>
        </section>

        <section className="fcc-section">
          <h3 className="fcc-section__title">Listing details</h3>
          {/* raw fields mostly for debugging against our db schema */}
          <ul className="fcc-section__body fcc-listing-meta">
            <li>
              <strong>Status:</strong> {posting.status}
            </li>
            {posting.expiration_date ? (
              <li>
                <strong>Expires:</strong> {posting.expiration_date}
              </li>
            ) : null}
            {posting.banner_image_url ? (
              <li>
                <strong>Banner:</strong>{' '}
                <a href={posting.banner_image_url}>View image</a>
              </li>
            ) : null}
            {posting.custom_color ? (
              <li>
                <strong>Accent:</strong>{' '}
                <span
                  className="fcc-swatch"
                  style={{ backgroundColor: posting.custom_color }}
                />{' '}
                {posting.custom_color}
              </li>
            ) : null}
            <li>
              <strong>Listing ID:</strong> <code>{posting.listing_id}</code>
            </li>
            <li>
              <strong>Created:</strong> {posting.created_at}
            </li>
            <li>
              <strong>Updated:</strong> {posting.updated_at}
            </li>
            <li>
              <strong>Posted by (user):</strong>{' '}
              <code>{posting.created_by_user_id}</code>
            </li>
          </ul>
        </section>

        <section className="fcc-section">
          <h3 className="fcc-section__title">About the poster</h3>
          <div className="fcc-poster-card">
            <div className="fcc-poster-card__avatar" aria-hidden />
            <div className="fcc-poster-card__info">
              <div className="fcc-poster-card__name">{profile?.full_name}</div>
              <div className="fcc-poster-card__sub">
                {creatorSubtitle(posting)}
              </div>
              {user?.email_verified ? (
                <div className="fcc-verified">
                  <IconVerified />
                  Verified Student
                </div>
              ) : null}
              {user?.teacher_badge ? (
                <div className="fcc-verified fcc-verified--teacher">Faculty / Staff badge</div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <footer className="fcc-detail__footer">
        <button
          type="button"
          className="fcc-btn fcc-btn--primary fcc-btn--grow"
          onClick={() => {
            setApplicationError('')
            setIsApplyModalOpen(true)
          }}
          disabled={hasApplied}
        >
          <IconSend />
          {hasApplied ? 'Application Sent' : 'Apply Now'}
        </button>
        <button type="button" className="fcc-btn fcc-btn--outline">
          <IconMessage />
          Email
        </button>
      </footer>

      {isApplyModalOpen ? (
        <div className="fcc-modal-backdrop" role="presentation">
          <div
            className="fcc-application-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-modal-title"
          >
            <div className="fcc-application-modal__head">
              <div>
                <p className="fcc-application-modal__eyebrow">Application</p>
                <h2
                  id="application-modal-title"
                  className="fcc-application-modal__title"
                >
                  {posting.title}
                </h2>
              </div>
              <button
                type="button"
                className="fcc-icon-btn"
                aria-label="Close application form"
                onClick={closeApplyModal}
                disabled={isSubmittingApplication}
              >
                x
              </button>
            </div>

            <form className="fcc-application-form" onSubmit={handleApplySubmit}>
              <label className="fcc-application-form__field">
                <span>Message to the poster</span>
                <textarea
                  value={applicationMessage}
                  onChange={(event) => {
                    setApplicationMessage(event.target.value)
                    if (applicationError) setApplicationError('')
                  }}
                  placeholder="Introduce yourself and explain why you are interested."
                  rows={7}
                  disabled={isSubmittingApplication}
                  autoFocus
                />
              </label>

              {applicationError ? (
                <p className="fcc-application-form__error">
                  {applicationError}
                </p>
              ) : null}

              <div className="fcc-application-form__actions">
                <button
                  type="button"
                  className="fcc-btn fcc-btn--outline"
                  onClick={closeApplyModal}
                  disabled={isSubmittingApplication}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fcc-btn fcc-btn--primary"
                  disabled={isSubmittingApplication}
                >
                  <IconSend />
                  {isSubmittingApplication ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
